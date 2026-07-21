
export default function PageHeader({ title, subtitle }) {
    return (
        <div className="bg-zinc-950 pt-24 pb-12 md:pt-32 md:pb-20 text-center px-6">
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-zinc-100 mb-2">
                {title}
            </h1>
            {subtitle && (
                <p className="text-zinc-400 text-sm md:text-lg">{subtitle}</p>
            )}
        </div>
    );
}
