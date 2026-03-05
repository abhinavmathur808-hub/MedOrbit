
export default function CurvedWrapper({ children, className = "" }) {
    return (
        <div
            className={`bg-[#09090b] rounded-t-[3rem] border-t-2 border-rose-600 shadow-[0_-15px_40px_rgba(225,29,72,0.12)] -mt-12 relative z-10 pt-16 pb-24 px-6 md:px-12 w-full ${className}`}
        >
            {children}
        </div>
    );
}
