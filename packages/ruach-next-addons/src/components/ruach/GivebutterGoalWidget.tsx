"use client";
export default function GivebutterGoalWidget({ dataGoalId }:{ dataGoalId: string }){
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <h3 className="font-semibold">Campaign Progress</h3>
      <iframe
        src={`https://embed.givebutter.com/${dataGoalId}?tab=donations`}
        className="mt-3 h-[520px] w-full rounded-lg"
      />
    </div>
  );
}
