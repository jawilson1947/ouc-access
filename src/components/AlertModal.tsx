import React from 'react';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

export function AlertModal({ isOpen, title, message, onClose }: AlertModalProps) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#000033'
                }}>
                    {title}
                </h2>
                <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '16px',
                    color: '#333',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                }}>
                    {message}
                </p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#000033',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
