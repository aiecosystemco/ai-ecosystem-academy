import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VOICE_MAX_CHARS, VOICE_MAX_SECONDS } from "@/lib/campus-util";
import { toast } from "sonner";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

export function VoiceNoteRecorder({
  disabled,
  onSend,
  label = "Voice note",
}: {
  disabled?: boolean;
  onSend: (dataUrl: string) => Promise<void> | void;
  label?: string;
}) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function start() {
    if (disabled) return;
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice notes need a browser that can record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result ?? "");
          if (url.length > VOICE_MAX_CHARS) {
            toast.error("That voice note is too long. Keep it under 20 seconds.");
            return;
          }
          void onSend(url);
        };
        reader.readAsDataURL(blob);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      timer.current = window.setTimeout(() => stop(), VOICE_MAX_SECONDS * 1000);
    } catch {
      toast.error("Microphone permission is needed for voice notes.");
    }
  }

  function stop() {
    if (timer.current) window.clearTimeout(timer.current);
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  }

  return (
    <Button
      type="button"
      variant={recording ? "danger" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={() => (recording ? stop() : void start())}
    >
      {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
      {recording ? "Stop" : label}
    </Button>
  );
}

export function VoiceNotePlayer({ src }: { src: string }) {
  if (!src) return null;
  return (
    <audio controls src={src} className="mt-2 w-full max-w-sm">
      Voice note
    </audio>
  );
}
