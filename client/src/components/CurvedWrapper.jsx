
export default function CurvedWrapper({ children, className = "" }) {
    return (
        <div
            className={`bg-neutral-950 rounded-t-[3rem] border-t-2 border-burgundy-600 shadow-[0_-15px_40px_rgba(155,27,48,0.14)] -mt-12 relative z-10 pt-16 pb-24 px-6 md:px-12 w-full ${className}`}
        >
            {children}
        </div>
    );
}
