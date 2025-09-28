"use client";
import { useEffect, useRef, useState } from "react"; import { markProgress } from "@/lib/progress"; import { track } from "@/lib/analytics";
export default function LessonPlayer({ src, courseSlug, lessonSlug }:{ src?:string; courseSlug:string; lessonSlug:string; }){
  const ref=useRef<HTMLVideoElement|null>(null); const [seconds,setSeconds]=useState(0);
  useEffect(()=>{const el=ref.current;if(!el)return;const onTime=()=>setSeconds(Math.floor(el.currentTime));const onPlay=()=>{track("LessonVideoPlay",{course:courseSlug,lesson:lessonSlug});track("VideoOpen",{course:courseSlug,lesson:lessonSlug});};const onEnded=async()=>{try{await markProgress({courseSlug,lessonSlug,secondsWatched:Math.floor(el.duration),completed:true});}catch{}track("LessonVideoComplete",{course:courseSlug,lesson:lessonSlug});};el.addEventListener("timeupdate",onTime);el.addEventListener("play",onPlay);el.addEventListener("ended",onEnded);return()=>{el.removeEventListener("timeupdate",onTime);el.removeEventListener("play",onPlay);el.removeEventListener("ended",onEnded);};},[courseSlug,lessonSlug]);
  useEffect(()=>{if(!seconds)return;const id=setInterval(()=>{markProgress({courseSlug,lessonSlug,secondsWatched:seconds}).catch(()=>{});},15000);return()=>clearInterval(id);},[seconds,courseSlug,lessonSlug]);
  if(!src)return<div className="p-8 text-center text-neutral-500">Video coming soon.</div>; const isIframe=src.includes("youtube.com")||src.includes("youtu.be")||src.includes("vimeo.com");
  return isIframe?(<iframe src={src} className="h-[56vw] max-h-[70vh] w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Lesson video"/>):(<video ref={ref} className="w-full" src={src} controls/>);
}
