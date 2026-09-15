package ai.nova.app

import android.webkit.JavascriptInterface
import org.json.JSONArray
import org.json.JSONObject

/**
 * Billing is behind [StoreBillingClient] so Cafe Bazaar / Play Billing SDKs
 * can be dropped in later without rewriting the UI. No RSA keys, merchant
 * secrets, or payment tokens are shipped in the APK; those come from CI
 * secrets into BuildConfig at assemble time (empty by default).
 */
class PaymentBridge(
    private val activity: MainActivity,
    private val client: StoreBillingClient = StoreBillingClient.fromBuild(activity),
) {
    @JavascriptInterface
    fun getProviderId(): String = client.providerId

    @JavascriptInterface
    fun getProducts(): String {
        val arr = JSONArray()
        for (p in StoreCatalog.products) {
            arr.put(
                JSONObject()
                    .put("id", p.id)
                    .put("title", p.title)
                    .put("description", p.description)
                    .put("period", p.period)
                    .put("storePriceLabel", p.storePriceLabel),
            )
        }
        return arr.toString()
    }

    @JavascriptInterface
    fun getEntitlement(): String = client.queryPremium().toJson().toString()

    @JavascriptInterface
    fun isPremium(): Boolean = client.queryPremium().premium

    @JavascriptInterface
    fun purchase(productId: String): String {
        val result = client.launchPurchase(activity, productId)
        return result.toJson().toString()
    }

    @JavascriptInterface
    fun restore(): String = client.restore().toJson().toString()
}

data class StoreProduct(
    val id: String,
    val title: String,
    val description: String,
    val period: String,
    val storePriceLabel: String,
)

object StoreCatalog {
    val products = listOf(
        StoreProduct(
            "nova_premium_monthly",
            "نوا ویژه — ماهانه",
            "پیام نامحدود و سقف توکن بالاتر",
            "monthly",
            "قیمت در فروشگاه",
        ),
        StoreProduct(
            "nova_premium_lifetime",
            "نوا ویژه — یک‌بار پرداخت",
            "خرید دائمی روی همین حساب فروشگاه",
            "lifetime",
            "قیمت در فروشگاه",
        ),
    )
}

data class Entitlement(
    val premium: Boolean,
    val productId: String? = null,
    val source: String = "none",
    val updatedAt: Long = System.currentTimeMillis(),
) {
    fun toJson(): JSONObject = JSONObject()
        .put("premium", premium)
        .put("productId", productId ?: JSONObject.NULL)
        .put("source", source)
        .put("updatedAt", updatedAt)
}

data class PurchaseOutcome(
    val ok: Boolean,
    val entitlement: Entitlement? = null,
    val error: String? = null,
    val cancelled: Boolean = false,
) {
    fun toJson(): JSONObject {
        val o = JSONObject().put("ok", ok).put("cancelled", cancelled)
        if (entitlement != null) o.put("entitlement", entitlement.toJson())
        if (error != null) o.put("error", error)
        return o
    }
}

interface StoreBillingClient {
    val providerId: String
    fun queryPremium(): Entitlement
    fun launchPurchase(activity: MainActivity, productId: String): PurchaseOutcome
    fun restore(): Entitlement

    companion object {
        fun fromBuild(activity: MainActivity): StoreBillingClient {
            val bazaarKey = BuildConfig.BAZAAR_RSA_PUBLIC_KEY
            val playKey = BuildConfig.PLAY_LICENSE_KEY
            return when {
                bazaarKey.isNotBlank() -> CafeBazaarBillingClient(activity, bazaarKey)
                playKey.isNotBlank() -> PlayBillingClient(activity, playKey)
                else -> UnconfiguredBillingClient(activity)
            }
        }
    }
}

/**
 * Used until a store SDK and its public license key are injected at build time.
 * Debug builds may locally mark premium for UI QA; release builds never do.
 */
class UnconfiguredBillingClient(private val activity: MainActivity) : StoreBillingClient {
    override val providerId: String = "unconfigured"

    override fun queryPremium(): Entitlement = EntitlementStore.read(activity)

    override fun launchPurchase(activity: MainActivity, productId: String): PurchaseOutcome {
        if (!BuildConfig.DEBUG) {
            return PurchaseOutcome(
                ok = false,
                error = "درگاه فروشگاه هنوز پیکربندی نشده است.",
            )
        }
        val ent = Entitlement(true, productId, "local", System.currentTimeMillis())
        EntitlementStore.write(activity, ent)
        return PurchaseOutcome(ok = true, entitlement = ent)
    }

    override fun restore(): Entitlement = EntitlementStore.read(activity)
}

/**
 * Cafe Bazaar IAB hook. The RSA public key is injected via BuildConfig from a
 * CI secret — never committed. When the bazaar IAB helper is on the classpath,
 * replace the body of launchPurchase with the official purchase flow.
 */
class CafeBazaarBillingClient(
    private val activity: MainActivity,
    @Suppress("unused") private val rsaPublicKey: String,
) : StoreBillingClient {
    override val providerId: String = "cafe-bazaar"

    override fun queryPremium(): Entitlement = EntitlementStore.read(activity)

    override fun launchPurchase(activity: MainActivity, productId: String): PurchaseOutcome {
        val helper = runCatching {
            Class.forName("com.farsitel.bazaar.IabHelper")
        }.getOrNull()
        if (helper == null) {
            return PurchaseOutcome(
                ok = false,
                error = "SDK کافه‌بازار در این ساخت نیست. کلید عمومی موجود است؛ SDK را به Gradle اضافه کنید.",
            )
        }
        return PurchaseOutcome(ok = false, error = "اتصال SDK کافه‌بازار هنوز تکمیل نشده است.")
    }

    override fun restore(): Entitlement = EntitlementStore.read(activity)
}

class PlayBillingClient(
    private val activity: MainActivity,
    @Suppress("unused") private val licenseKey: String,
) : StoreBillingClient {
    override val providerId: String = "google-play"

    override fun queryPremium(): Entitlement = EntitlementStore.read(activity)

    override fun launchPurchase(activity: MainActivity, productId: String): PurchaseOutcome {
        val client = runCatching {
            Class.forName("com.android.billingclient.api.BillingClient")
        }.getOrNull()
        if (client == null) {
            return PurchaseOutcome(
                ok = false,
                error = "Play Billing Library در این ساخت نیست.",
            )
        }
        return PurchaseOutcome(ok = false, error = "اتصال Play Billing هنوز تکمیل نشده است.")
    }

    override fun restore(): Entitlement = EntitlementStore.read(activity)
}

object EntitlementStore {
    private const val PREF = "nova.billing"
    private const val KEY = "entitlement"

    fun read(activity: MainActivity): Entitlement {
        val raw = activity.getSharedPreferences(PREF, 0).getString(KEY, null) ?: return Entitlement(false)
        return runCatching {
            val o = JSONObject(raw)
            Entitlement(
                premium = o.optBoolean("premium"),
                productId = o.optString("productId").ifBlank { null },
                source = o.optString("source", "store"),
                updatedAt = o.optLong("updatedAt", 0),
            )
        }.getOrElse { Entitlement(false) }
    }

    fun write(activity: MainActivity, value: Entitlement) {
        activity.getSharedPreferences(PREF, 0).edit().putString(KEY, value.toJson().toString()).apply()
    }
}
