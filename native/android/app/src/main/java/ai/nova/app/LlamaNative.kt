package ai.nova.app

/**
 * JNI surface for nova_llama.cpp. Load failures never crash the process;
 * [available] stays false and the UI shows «مدل نصب نشده».
 */
object LlamaNative {
    @Volatile
    var available: Boolean = false
        private set

    init {
        try {
            System.loadLibrary("nova_llama")
            available = true
        } catch (err: UnsatisfiedLinkError) {
            available = false
        } catch (err: SecurityException) {
            available = false
        }
    }

    interface Callback {
        fun onToken(piece: String)
        fun onDone(full: String)
        fun onError(message: String)
    }

    external fun nativeInit(path: String, nCtx: Int, nThreads: Int, nBatch: Int): String
    external fun nativeIsReady(): Boolean
    external fun nativeGenerate(
        prompt: String,
        temperature: Float,
        maxTokens: Int,
        topP: Float,
        topK: Int,
        callback: Callback,
    )
    external fun nativeRelease()
    external fun nativeAbort()
}
