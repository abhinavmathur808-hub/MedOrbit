
export default function PageHeader({ title, subtitle }) {
    return (
        <div className="bg-[#09090b] pt-32 pb-20 text-center px-6">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
                {title}
            </h1>
            {subtitle && (
                <p className="text-zinc-400 text-lg">{subtitle}</p>
            )}
        </div>
    );
}
