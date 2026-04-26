import Link from "next/link";

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0e7] text-[#a39888]">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-bold text-[#5f574d]">{title}</p>
      <p className="text-xs text-[#81786d]">{description}</p>
    </div>
  );
}

export function StatPill({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-3 transition hover:border-[#c95d3a] hover:bg-[#fbfaf5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f8678]"
    >
      <div className="mb-2 flex items-center justify-between text-[#81786d]">
        <span className="text-xs font-bold">{label}</span>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="truncate text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </Link>
  );
}
