export default function Footer() {
  return (
    <footer className="border-t border-black/10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-600">
        © {new Date().getFullYear()} Ruach Ministries. All rights reserved.
      </div>
    </footer>
  );
}
