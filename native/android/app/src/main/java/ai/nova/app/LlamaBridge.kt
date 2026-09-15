package ai.nova.app

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.concurrent.Executors
import kotlin.math.max

/**
 * JavaScript ↔ Native C++ bridge.
 * Methods match the required surface: initializeModel, isModelReady,
 * generateResponse, releaseModel.
 */
class LlamaBridge(
    private val activity: MainActivity,
    private val webView: () -> WebView?,
) {
    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val defaults = InferenceConfig

    @Volatile
    private var lastStatus: JSONObject = missingStatus("هنوز مقداردهی نشده")

    @JavascriptInterface
    fun initializeModel(configJson: String?): String {
        if (!LlamaNative.available) {
            lastStatus = missingStatus("کتابخانهٔ نیتیو بارگذاری نشد")
            return lastStatus.toString()
        }
        val cfg = runCatching { JSONObject(configJson ?: "{}") }.getOrElse { JSONObject() }
        val nCtx = cfg.optInt("nCtx", defaults.contextSize)
        val nThreads = cfg.optInt("nThreads", defaults.nThreads)
        val nBatch = cfg.optInt("nBatch", defaults.nBatch)

        val file = ModelLocator.find(activity.applicationContext)
        if (file == null) {
            lastStatus = missingStatus("مدل نصب نشده")
            return lastStatus.toString()
        }
        return try {
            val raw = LlamaNative.nativeInit(file.absolutePath, nCtx, nThreads, nBatch)
            val parsed = runCatching { JSONObject(raw) }.getOrElse { missingStatus(raw) }
            if (parsed.optBoolean("ready")) {
                parsed.put("modelPath", file.absolutePath)
            }
            lastStatus = parsed
            parsed.toString()
        } catch (err: Throwable) {
            lastStatus = json("error", false, err.message ?: "بارگذاری ناموفق")
            lastStatus.toString()
        }
    }

    @JavascriptInterface
    fun isModelReady(): Boolean {
        return LlamaNative.available && LlamaNative.nativeIsReady()
    }

    @JavascriptInterface
    fun getModelStatus(): String {
        if (!LlamaNative.available) {
            return missingStatus("کتابخانهٔ نیتیو در دسترس نیست").toString()
        }
        if (LlamaNative.nativeIsReady()) {
            lastStatus = json("ready", true, "مدل آماده است")
        }
        return lastStatus.toString()
    }

    @JavascriptInterface
    fun generateResponse(payloadJson: String?, requestId: String?) {
        val id = requestId ?: "req"
        if (!LlamaNative.available || !LlamaNative.nativeIsReady()) {
            dispatchJs("__novaOnError", id, "مدل نصب نشده")
            return
        }
        val payload = runCatching { JSONObject(payloadJson ?: "{}") }.getOrElse { JSONObject() }
        val messages = payload.optJSONArray("messages")?.toString() ?: "[]"
        val prompt = GemmaTemplate.apply(messages, addGenerationPrompt = true)
        val temperature = payload.optDouble("temperature", defaults.temperature.toDouble()).toFloat()
        val maxTokens = payload.optInt("maxTokens", defaults.maxTokens)
        val topP = payload.optDouble("topP", defaults.topP.toDouble()).toFloat()
        val topK = payload.optInt("topK", defaults.topK)

        io.execute {
            try {
                LlamaNative.nativeGenerate(
                    prompt,
                    temperature,
                    max(32, maxTokens),
                    topP,
                    topK,
                    object : LlamaNative.Callback {
                        override fun onToken(piece: String) {
                            dispatchJs("__novaOnToken", id, piece)
                        }

                        override fun onDone(full: String) {
                            dispatchJs("__novaOnDone", id, full)
                        }

                        override fun onError(message: String) {
                            dispatchJs("__novaOnError", id, message)
                        }
                    },
                )
            } catch (err: Throwable) {
                dispatchJs("__novaOnError", id, err.message ?: "خطای تولید")
            }
        }
    }

    @JavascriptInterface
    fun releaseModel() {
        if (LlamaNative.available) {
            runCatching { LlamaNative.nativeRelease() }
        }
        lastStatus = missingStatus("مدل آزاد شد")
    }

    @JavascriptInterface
    fun abortGeneration() {
        if (LlamaNative.available) LlamaNative.nativeAbort()
    }

    private fun dispatchJs(fn: String, requestId: String, value: String) {
        val rid = jsonEscape(requestId)
        val payload = jsonEscape(value)
        main.post {
            webView()?.evaluateJavascript("window.$fn && window.$fn(\"$rid\",\"$payload\")", null)
        }
    }

    private fun jsonEscape(s: String): String =
        s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")

    private fun missingStatus(message: String) = json("missing", false, message)

    private fun json(code: String, ready: Boolean, message: String) =
        JSONObject()
            .put("code", code)
            .put("ready", ready)
            .put("message", message)
}

object InferenceConfig {
    const val temperature = 0.7f
    const val topP = 0.95f
    const val topK = 64
    const val maxTokens = 512
    const val contextSize = 4096
    const val nThreads = 4
    const val nBatch = 256
}
