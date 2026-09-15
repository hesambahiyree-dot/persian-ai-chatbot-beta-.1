package ai.nova.app

import android.content.Context
import android.util.Log
import java.io.File
import java.io.FileInputStream
import java.util.zip.ZipInputStream

object ModelLocator {
    const val FILE_NAME = "gemma-3-4b-persian-v0.Q4_K_M.gguf"
    private const val TAG = "NovaModel"

    fun find(context: Context): File? {
        val unpacked = File(context.filesDir, "models/$FILE_NAME")
        if (isGguf(unpacked)) return unpacked

        val candidates = mutableListOf<File>()
        context.obbDir?.let { obb ->
            candidates += File(obb, FILE_NAME)
            val version = runCatching { context.packageManager.getPackageInfo(context.packageName, 0).versionCode }.getOrDefault(1)
            candidates += File(obb, "main.$version.${context.packageName}.obb")
            candidates += File(obb, "patch.$version.${context.packageName}.obb")
            obb.listFiles()?.forEach { candidates += it }
        }
        context.getExternalFilesDir("models")?.let { candidates += File(it, FILE_NAME) }
        candidates += File(context.filesDir, "models/$FILE_NAME")

        for (file in candidates.distinctBy { it.absolutePath }) {
            if (!file.exists() || !file.canRead() || file.length() < 1024) continue
            if (isGguf(file)) return file
            if (file.name.endsWith(".obb") || file.name.endsWith(".zip")) {
                val extracted = extractGguf(file, unpacked)
                if (extracted != null) return extracted
            }
        }
        return null
    }

    private fun isGguf(file: File): Boolean {
        if (!file.isFile || !file.canRead()) return false
        return try {
            FileInputStream(file).use { ins ->
                val magic = ByteArray(4)
                if (ins.read(magic) != 4) return false
                magic.contentEquals(byteArrayOf('G'.code.toByte(), 'G'.code.toByte(), 'U'.code.toByte(), 'F'.code.toByte()))
            }
        } catch (err: Exception) {
            Log.w(TAG, "gguf probe failed: ${file.absolutePath}", err)
            false
        }
    }

    private fun extractGguf(archive: File, dest: File): File? {
        return try {
            dest.parentFile?.mkdirs()
            ZipInputStream(FileInputStream(archive)).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    val name = File(entry.name).name
                    if (!entry.isDirectory && (name.endsWith(".gguf") || name == FILE_NAME)) {
                        dest.outputStream().use { zip.copyTo(it) }
                        zip.closeEntry()
                        return if (isGguf(dest)) dest else null
                    }
                    zip.closeEntry()
                    entry = zip.nextEntry
                }
            }
            null
        } catch (err: Exception) {
            Log.w(TAG, "obb extract failed", err)
            null
        }
    }
}
