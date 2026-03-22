import { cn } from "@/lib/utils";
import React from "react";

export interface FeatureProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  soon?: boolean;
}

export function FeaturesSectionWithHoverEffects({ features }: { features: FeatureProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-5xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  desc,
  icon,
  soon,
  index,
}: FeatureProps & { index: number }) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 3) && "lg:border-l dark:border-neutral-800",
        index < 3 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        <div className="text-[#FE703A] opacity-80 group-hover/feature:opacity-100 transition duration-200">
          {icon}
        </div>
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-[#FE703A] transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-zinc-900 dark:text-neutral-100">
          <span className="flex items-center gap-2">
            {title}
            {soon && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                Yakında
              </span>
            )}
          </span>
        </span>
      </div>
      <p className="text-sm text-zinc-500 dark:text-neutral-300 max-w-xs relative z-10 px-10 leading-relaxed">
        {desc}
      </p>
    </div>
  );
};
