import React from 'react'
import { AlertCircle, Trash2, X } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isLoading = false
}: Props) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold transition-all px-6 min-w-[100px]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
