import type { ReactNode } from "react";
import { CheckCircle2, XCircle, Info, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

type AlertVariant = "success" | "error" | "info" | "warning";

interface AlertAction {
    label: string;
    onClick?: () => void;
    to?: string;
    variant?: "primary" | "secondary";
}

interface ActionAlertProps {
    open: boolean;
    title: string;
    message?: string;
    variant?: AlertVariant;
    onClose?: () => void;
    primaryAction?: AlertAction;
    secondaryAction?: AlertAction;
    footer?: ReactNode;
}

function getIcon(variant: AlertVariant) {
    switch (variant){
        case "success":
            return <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />;
        case "error":
            return <XCircle className="h-10 w-10" strokeWidth={2.5} />;
        case "warning":
            return <TriangleAlert className="h-10 w-10" strokeWidth={2.5} />;
        default:
            return <Info className="h-10 w-10" strokeWidth={2.5} />
    }
}

function getIconBg(variant: AlertVariant) {
    switch(variant) {
        case "success":
            return "bg-[#000000] text-white";
        case "error":
            return "bg-[#ef4444] text-white";
        case "warning":
            return "bg-[#f59e0b] text-white";
        default:
            return "bg-[#3b82f6] text-white"; 
    }
}

function ActionButton({ action }: { action: AlertAction }) {
    const baseClass = action.variant === "secondary"
        ? "inline-flex h-[62px] min-w-[210px] items-center justify-center rounded-full border border-[#6b7280] bg-white px-8 text-[20px] font-semibold text-[#434b61] transition hover:bg-[#f8fafc]"
        : "inline-flex h-[62px] min-w-[210px] items-center justify-center rounded-full bg-[#434b61] px-8 text-[20px] font-semibold text-white transition hover:opacity-95";
    
    if (action.to) {
        return (
            <Link to={action.to} className={baseClass}>
                {action.label}
            </Link>
        );
    }
    return (
        <button type="button" onClick={action.onClick} className={baseClass}>
            {action.label}
        </button>
    );
}

export function ActionAlert({
    open,
    title,
    message,
    variant = "success",
    onClose,
    primaryAction,
    secondaryAction,
    footer
}: ActionAlertProps) {
    if (!open) return null;

    return (
        <div 
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-[rgba(15,23,42,0.18)] backdrop-blur-[3px] px-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[1050px] rounded-[16px] border border-[#b8b8b8] bg-white px-8 py-16 shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`flex h-[72px] w-[72px] items-center justify-center rounded-full ${getIconBg(variant)}`}
                    >
                        {getIcon(variant)}
                    </div>
                    <h2 className="mt-10 text-[56px] font-medium leading-none text-[#3f4658]">
                        {title}
                    </h2>

                    {message ? (
                        <p className="mt-5 text-[22px] text-[#6b7280]">
                            {message}
                        </p>
                    ) : null}

                    {footer ? (
                        <div className="mt-12">{footer}</div>
                    ) : primaryAction || secondaryAction ? (
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
                            {primaryAction ? <ActionButton action={primaryAction} /> : null}
                            {secondaryAction ? <ActionButton action={secondaryAction} /> : null}
                        </div>
                    ): null }
                </div>
            </div>
        </div>
    )

}
