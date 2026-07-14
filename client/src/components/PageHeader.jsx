
export default function PageHeader({ title, subtitle }) {
    return (
        <div className="bg-neutral-950 pt-32 pb-20 text-center px-6">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-100 mb-2">
                {title}
            </h1>
            {subtitle && (
                <p className="text-neutral-400 text-lg">{subtitle}</p>
            )}
        </div>
    );
}
