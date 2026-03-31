"use client";

import { cn } from "../../lib/utils";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-6 rounded-2xl overflow-hidden transition-all duration-500",
                        "border border-border bg-bg-card/50 backdrop-blur-sm",
                        "hover:border-amber/40 hover:bg-bg-card",
                        "hover:shadow-[0_0_40px_rgba(245,166,35,0.05)]",
                        "hover:-translate-y-1 will-change-transform",
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
                        {
                            "shadow-[0_0_40px_rgba(245,166,35,0.05)] -translate-y-1":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    {/* Background Pattern */}
                    <div
                        className={`absolute inset-0 ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-500`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,166,35,0.03)_1px,transparent_1px)] bg-[length:12px:12px]" />
                    </div>

                    <div className="relative flex flex-col h-full justify-between space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber/10 border border-amber/20 group-hover:scale-110 transition-transform duration-500">
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-mono font-bold px-2 py-1 rounded-lg border",
                                    "bg-bg-secondary border-border text-text-muted uppercase tracking-widest",
                                    "transition-colors duration-300 group-hover:border-amber/30 group-hover:text-amber"
                                )}
                            >
                                {item.status || "SECURE"}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-display font-bold text-text-primary tracking-tight text-lg">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-2 font-mono text-[10px] text-text-muted font-normal uppercase tracking-tighter">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs text-text-secondary leading-relaxed font-mono opacity-80">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-bg-primary border border-border text-text-muted transition-all duration-300 group-hover:border-amber/20 group-hover:text-text-secondary"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                                {item.cta || "VIEW DETAILS →"}
                            </span>
                        </div>
                    </div>

                    {/* Gradient Border Trace */}
                    <div
                        className={`absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-amber/20 to-transparent ${
                            item.hasPersistentHover
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                        } transition-opacity duration-500`}
                    />
                </div>
            ))}
        </div>
    );
}

export { BentoGrid }
