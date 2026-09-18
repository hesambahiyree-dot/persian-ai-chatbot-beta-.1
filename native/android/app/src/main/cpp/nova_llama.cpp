#include <android/log.h>
#include <jni.h>

#include <algorithm>
#include <atomic>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <mutex>
#include <string>
#include <vector>

#include "llama.h"

#define NOVA_TAG "nova_llama"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, NOVA_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, NOVA_TAG, __VA_ARGS__)

namespace {

std::mutex g_mu;
llama_model *g_model = nullptr;
llama_context *g_ctx = nullptr;
int g_n_batch = 256;
std::atomic<bool> g_abort{false};
std::atomic<bool> g_ready{false};
std::atomic<bool> g_busy{false};

void llama_log_cb(enum ggml_log_level level, const char *text, void * /*user*/) {
    int prio = ANDROID_LOG_INFO;
    if (level >= GGML_LOG_LEVEL_ERROR) prio = ANDROID_LOG_ERROR;
    else if (level >= GGML_LOG_LEVEL_WARN) prio = ANDROID_LOG_WARN;
    __android_log_print(prio, NOVA_TAG, "%s", text);
}

void free_locked() {
    if (g_ctx) {
        llama_free(g_ctx);
        g_ctx = nullptr;
    }
    if (g_model) {
        llama_free_model(g_model);
        g_model = nullptr;
    }
    g_ready.store(false);
}

bool utf8_complete(const std::string &s) {
    if (s.empty()) return true;
    size_t i = s.size();
    while (i > 0) {
        --i;
        unsigned char b = static_cast<unsigned char>(s[i]);
        if ((b & 0xC0) != 0x80) {
            int need = 1;
            if ((b & 0x80) == 0) need = 1;
            else if ((b & 0xE0) == 0xC0) need = 2;
            else if ((b & 0xF0) == 0xE0) need = 3;
            else if ((b & 0xF8) == 0xF0) need = 4;
            else return false;
            return (s.size() - i) >= static_cast<size_t>(need);
        }
    }
    return false;
}

std::string token_piece(llama_token tok) {
    char buf[256];
    int n = llama_token_to_piece(g_model, tok, buf, sizeof(buf), 0, true);
    if (n < 0) {
        std::string grow(static_cast<size_t>(-n), '\0');
        llama_token_to_piece(g_model, tok, grow.data(), -n, 0, true);
        return grow;
    }
    return std::string(buf, buf + n);
}

void strip_stop(std::string *text) {
    const char *stops[] = {"<end_of_turn>", "<start_of_turn>", "<eos>"};
    for (const char *s : stops) {
        auto pos = text->find(s);
        if (pos != std::string::npos) {
            text->erase(pos);
        }
    }
}

void emit_java(JNIEnv *env, jobject cb, const char *method, const char *arg) {
    if (!cb || env->ExceptionCheck()) return;
    jclass cls = env->GetObjectClass(cb);
    if (!cls) return;
    jmethodID mid = env->GetMethodID(cls, method, "(Ljava/lang/String;)V");
    if (!mid) {
        env->ExceptionClear();
        env->DeleteLocalRef(cls);
        return;
    }
    jstring jarg = env->NewStringUTF(arg ? arg : "");
    env->CallVoidMethod(cb, mid, jarg);
    if (env->ExceptionCheck()) env->ExceptionClear();
    env->DeleteLocalRef(jarg);
    env->DeleteLocalRef(cls);
}

}  // namespace

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM * /*vm*/, void * /*reserved*/) {
    llama_log_set(llama_log_cb, nullptr);
    llama_backend_init();
    return JNI_VERSION_1_6;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_ai_nova_app_LlamaNative_nativeIsReady(JNIEnv *, jclass) {
    return g_ready.load() && g_model && g_ctx ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_ai_nova_app_LlamaNative_nativeAbort(JNIEnv *, jclass) {
    g_abort.store(true);
}

extern "C" JNIEXPORT void JNICALL
Java_ai_nova_app_LlamaNative_nativeRelease(JNIEnv *, jclass) {
    g_abort.store(true);
    std::lock_guard<std::mutex> lock(g_mu);
    free_locked();
}

extern "C" JNIEXPORT jstring JNICALL
Java_ai_nova_app_LlamaNative_nativeInit(
    JNIEnv *env,
    jclass,
    jstring jpath,
    jint n_ctx,
    jint n_threads,
    jint n_batch) {
    if (!jpath) {
        return env->NewStringUTF("{\"ready\":false,\"code\":\"missing\",\"message\":\"path is null\"}");
    }

    const char *path_c = env->GetStringUTFChars(jpath, nullptr);
    std::string path = path_c ? path_c : "";
    env->ReleaseStringUTFChars(jpath, path_c);

    if (path.empty()) {
        return env->NewStringUTF("{\"ready\":false,\"code\":\"missing\",\"message\":\"empty model path\"}");
    }

    FILE *probe = std::fopen(path.c_str(), "rb");
    if (!probe) {
        LOGE("model file not found: %s", path.c_str());
        return env->NewStringUTF(
            "{\"ready\":false,\"code\":\"missing\",\"message\":\"مدل نصب نشده\"}");
    }
    std::fclose(probe);

    std::lock_guard<std::mutex> lock(g_mu);
    free_locked();
    g_abort.store(false);

    llama_model_params mparams = llama_model_default_params();
    mparams.n_gpu_layers = 0;
    mparams.use_mmap = true;
    mparams.use_mlock = false;

    LOGI("loading model (mmap): %s", path.c_str());
    llama_model *model = llama_load_model_from_file(path.c_str(), mparams);
    if (!model) {
        LOGI("mmap load failed, retry without mmap");
        mparams.use_mmap = false;
        model = llama_load_model_from_file(path.c_str(), mparams);
    }
    if (!model) {
        LOGE("llama_load_model_from_file failed");
        return env->NewStringUTF(
            "{\"ready\":false,\"code\":\"error\",\"message\":\"بارگذاری GGUF ناموفق بود\"}");
    }

    llama_context_params cparams = llama_context_default_params();
    cparams.n_ctx = n_ctx > 0 ? n_ctx : 4096;
    cparams.n_batch = n_batch > 0 ? n_batch : 256;
    cparams.n_ubatch = cparams.n_batch;
    int threads = n_threads > 0 ? n_threads : 4;
    cparams.n_threads = threads;
    cparams.n_threads_batch = threads;

    llama_context *ctx = llama_new_context_with_model(model, cparams);
    if (!ctx) {
        llama_free_model(model);
        return env->NewStringUTF(
            "{\"ready\":false,\"code\":\"error\",\"message\":\"ساخت context ناموفق بود\"}");
    }

    g_model = model;
    g_ctx = ctx;
    g_n_batch = static_cast<int>(cparams.n_batch);
    g_ready.store(true);
    LOGI("model ready n_ctx=%d threads=%d", static_cast<int>(cparams.n_ctx), threads);
    return env->NewStringUTF("{\"ready\":true,\"code\":\"ready\",\"message\":\"مدل آماده است\"}");
}

extern "C" JNIEXPORT void JNICALL
Java_ai_nova_app_LlamaNative_nativeGenerate(
    JNIEnv *env,
    jclass,
    jstring jprompt,
    jfloat temperature,
    jint max_tokens,
    jfloat top_p,
    jint top_k,
    jobject callback) {
    jobject cb = env->NewGlobalRef(callback);
    if (!jprompt) {
        emit_java(env, cb, "onError", "prompt is null");
        env->DeleteGlobalRef(cb);
        return;
    }

    const char *pc = env->GetStringUTFChars(jprompt, nullptr);
    std::string prompt = pc ? pc : "";
    env->ReleaseStringUTFChars(jprompt, pc);

    if (g_busy.exchange(true)) {
        emit_java(env, cb, "onError", "مدل مشغول است");
        env->DeleteGlobalRef(cb);
        return;
    }
    g_abort.store(false);

    std::lock_guard<std::mutex> lock(g_mu);
    if (!g_ready.load() || !g_model || !g_ctx) {
        emit_java(env, cb, "onError", "مدل نصب نشده");
        g_busy.store(false);
        env->DeleteGlobalRef(cb);
        return;
    }

    const int n_ctx = llama_n_ctx(g_ctx);
    const int n_batch = std::max(1, g_n_batch);

    llama_kv_cache_clear(g_ctx);

    std::vector<llama_token> tokens(prompt.size() + 32);
    int n_tok = llama_tokenize(
        g_model, prompt.c_str(), static_cast<int32_t>(prompt.size()),
        tokens.data(), static_cast<int32_t>(tokens.size()), true, true);
    if (n_tok < 0) {
        tokens.resize(static_cast<size_t>(-n_tok));
        n_tok = llama_tokenize(
            g_model, prompt.c_str(), static_cast<int32_t>(prompt.size()),
            tokens.data(), static_cast<int32_t>(tokens.size()), true, true);
    }
    if (n_tok <= 0) {
        emit_java(env, cb, "onError", "توکنایز ناموفق بود");
        g_busy.store(false);
        env->DeleteGlobalRef(cb);
        return;
    }
    tokens.resize(static_cast<size_t>(n_tok));

    if (n_tok >= n_ctx - 8) {
        emit_java(env, cb, "onError", "پیام از طول context بزرگ‌تر است");
        g_busy.store(false);
        env->DeleteGlobalRef(cb);
        return;
    }

    llama_batch batch = llama_batch_init(n_batch, 0, 1);
    auto fill_batch = [&](int start, int count, bool last_logits) {
        batch.n_tokens = count;
        for (int i = 0; i < count; ++i) {
            batch.token[i] = tokens[static_cast<size_t>(start + i)];
            batch.pos[i] = start + i;
            batch.n_seq_id[i] = 1;
            batch.seq_id[i][0] = 0;
            batch.logits[i] = 0;
        }
        if (last_logits && count > 0) {
            batch.logits[count - 1] = 1;
        }
    };

    for (int i = 0; i < n_tok; i += n_batch) {
        if (g_abort.load()) {
            llama_batch_free(batch);
            emit_java(env, cb, "onError", "لغو شد");
            g_busy.store(false);
            env->DeleteGlobalRef(cb);
            return;
        }
        int n = std::min(n_batch, n_tok - i);
        bool last = (i + n) >= n_tok;
        fill_batch(i, n, last);
        if (llama_decode(g_ctx, batch) != 0) {
            llama_batch_free(batch);
            emit_java(env, cb, "onError", "decode ناموفق بود");
            g_busy.store(false);
            env->DeleteGlobalRef(cb);
            return;
        }
    }

    llama_sampler_chain_params sparams = llama_sampler_chain_default_params();
    llama_sampler *smpl = llama_sampler_chain_init(sparams);
    int k = top_k > 0 ? top_k : 64;
    float p = top_p > 0.f && top_p <= 1.f ? top_p : 0.95f;
    float temp = temperature > 0.f ? temperature : 0.7f;
    llama_sampler_chain_add(smpl, llama_sampler_init_top_k(k));
    llama_sampler_chain_add(smpl, llama_sampler_init_top_p(p, 1));
    llama_sampler_chain_add(smpl, llama_sampler_init_temp(temp));
    llama_sampler_chain_add(smpl, llama_sampler_init_dist(LLAMA_DEFAULT_SEED));

    std::string out;
    std::string pending;
    int n_cur = n_tok;
    int cap = max_tokens > 0 ? max_tokens : 512;
    cap = std::min(cap, n_ctx - n_tok - 1);

    for (int t = 0; t < cap; ++t) {
        if (g_abort.load()) break;
        llama_token id = llama_sampler_sample(smpl, g_ctx, -1);
        llama_sampler_accept(smpl, id);
        if (llama_token_is_eog(g_model, id)) break;

        pending += token_piece(id);
        std::string combined = out + pending;
        if (combined.find("<end_of_turn>") != std::string::npos ||
            combined.find("<start_of_turn>") != std::string::npos) {
            strip_stop(&combined);
            pending = combined.size() > out.size() ? combined.substr(out.size()) : "";
            if (!pending.empty()) {
                emit_java(env, cb, "onToken", pending.c_str());
                out += pending;
                pending.clear();
            }
            break;
        }
        if (utf8_complete(pending) && !pending.empty()) {
            emit_java(env, cb, "onToken", pending.c_str());
            out += pending;
            pending.clear();
        }

        batch.n_tokens = 1;
        batch.token[0] = id;
        batch.pos[0] = n_cur;
        batch.n_seq_id[0] = 1;
        batch.seq_id[0][0] = 0;
        batch.logits[0] = 1;
        if (llama_decode(g_ctx, batch) != 0) {
            emit_java(env, cb, "onError", "decode در تولید ناموفق بود");
            llama_sampler_free(smpl);
            llama_batch_free(batch);
            g_busy.store(false);
            env->DeleteGlobalRef(cb);
            return;
        }
        n_cur++;
        if (n_cur >= n_ctx - 1) break;
    }

    if (!pending.empty()) {
        emit_java(env, cb, "onToken", pending.c_str());
        out += pending;
    }

    llama_sampler_free(smpl);
    llama_batch_free(batch);
    emit_java(env, cb, "onDone", out.c_str());
    g_busy.store(false);
    env->DeleteGlobalRef(cb);
}
