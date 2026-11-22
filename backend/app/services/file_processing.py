import logging
import os
import subprocess

from pypdf import PdfReader
from docx import Document

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"


def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs if p.text])
        return text.strip()
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"


def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        return f"Error reading text file: {str(e)}"


def _detect_device() -> tuple[str, str]:
    """Detect the best compute device for faster-whisper.

    faster-whisper is built on ctranslate2, which ships its own CUDA
    detection. We deliberately do NOT depend on torch here: importing torch
    at runtime (as the old code did) raises ModuleNotFoundError on systems
    where torch is not installed, and that ImportError was being swallowed
    and reported as "faster-whisper not installed".
    """
    try:
        import ctranslate2

        if (
            hasattr(ctranslate2, "is_cuda_available")
            and ctranslate2.is_cuda_available()
        ) or ctranslate2.get_cuda_device_count() > 0:
            return "cuda", "float16"
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("CUDA detection via ctranslate2 failed: %s", e)

    return "cpu", "int8"


def extract_audio_from_video(video_path: str, output_audio_path: str) -> bool:
    """Extract audio from a video file using ffmpeg.

    Returns True on success, False otherwise. ffmpeg failures are logged
    with the actual stderr so they are distinguishable from import or
    model errors.
    """
    try:
        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            output_audio_path,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=300,
        )
        if result.returncode != 0:
            logger.error(
                "FFmpeg audio extraction failed (returncode=%s): %s",
                result.returncode,
                result.stderr.decode("utf-8", errors="replace").strip(),
            )
            return False
        return True
    except FileNotFoundError:
        logger.error("FFmpeg executable not found on PATH")
        return False
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg audio extraction timed out after 300s")
        return False
    except Exception as e:
        logger.exception("Unexpected error extracting audio from video")
        return False


def transcribe_audio(file_path: str) -> str:
    """Transcribe an audio file using faster-whisper.

    Every failure mode is distinguished and logged:
      * ImportError  -> faster-whisper itself is missing/broken
      * model load/download failure
      * transcription failure
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        logger.error("faster-whisper is not importable: %s", e)
        return "[Transcription unavailable: faster-whisper is not installed]"

    try:
        model_size = os.getenv("WHISPER_MODEL", "base")

        device, compute_type = _detect_device()
        logger.info(
            "Loading faster-whisper model '%s' on device=%s compute_type=%s",
            model_size, device, compute_type,
        )

        model = WhisperModel(model_size, device=device, compute_type=compute_type)

        logger.info("Transcribing %s", file_path)
        segments, info = model.transcribe(file_path, beam_size=5)

        transcript = " ".join([segment.text for segment in segments]).strip()
        logger.info(
            "Transcription complete: %d chars, detected language=%s",
            len(transcript),
            getattr(info, "language", "unknown"),
        )
        return transcript

    except ImportError as e:
        logger.error("ImportError while loading faster-whisper: %s", e)
        return "[Transcription unavailable: faster-whisper import failed]"
    except Exception as e:
        logger.exception("Transcription failed")
        return f"[Transcription error: {str(e)}]"


def process_file_content(file_path: str, file_type: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext in [".mp3", ".wav", ".m4a", ".webm"]:
        # Audio files - transcribe directly
        return transcribe_audio(file_path)
    elif ext in [".mp4", ".mov", ".mkv"]:
        # Video files - extract audio then transcribe
        audio_path = file_path + ".wav"
        if extract_audio_from_video(file_path, audio_path):
            transcript = transcribe_audio(audio_path)
            # Clean up temp audio file
            try:
                os.remove(audio_path)
            except OSError:
                pass
            return transcript
        else:
            return f"[Error: Failed to extract audio from {os.path.basename(file_path)}]"
    else:
        return "Unsupported file format for text extraction."