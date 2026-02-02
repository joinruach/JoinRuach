// Re-export from the package to ensure all consumers use the same React context
// The ToastProvider in providers.tsx is from @ruach/components, so useToast must match
export { useToast } from "@ruach/components/components/ruach/toast/ToastProvider";
