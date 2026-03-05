import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import './PDFPreviewModal.css';
import Button from '../Button/Button';

const PDFPreviewModal = ({
    isOpen,
    onClose,
    documentId,
    documentUrl,
    fileName,
    onMergePages,
    onSplitAll
}) => {
    const [selectedPages, setSelectedPages] = useState([]);
    const [numPages, setNumPages] = useState(0);
    const [pageElements, setPageElements] = useState([]);

    const togglePageSelection = (pageNum) => {
        setSelectedPages(prev => {
            if (prev.includes(pageNum)) {
                return prev.filter(p => p !== pageNum);
            } else {
                return [...prev, pageNum].sort((a, b) => a - b);
            }
        });
    };

    const selectAllPages = () => {
        if (selectedPages.length === numPages) {
            setSelectedPages([]);
        } else {
            setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
        }
    };

    const handleMergeSelected = () => {
        if (selectedPages.length < 2) {
            alert('Please select at least 2 pages to merge');
            return;
        }
        onMergePages(documentId, selectedPages);
    };

    const handleSplitAll = () => {
        if (!numPages) return;
        onSplitAll(documentId, numPages);
    };

    const handleDocumentLoad = (e) => {
        setNumPages(e.doc.numPages);
        const pages = Array.from({ length: e.doc.numPages }, (_, i) => i + 1);
        setPageElements(pages);
    };

    if (!isOpen) return null;

    return (
        <div className="pdf-preview-overlay" onClick={onClose}>
            <div className="pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-preview-left">
                    <div className="pdf-preview-header">
                        <h2>{fileName}</h2>
                        <button className="pdf-preview-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="pdf-preview-toolbar">
                        <div className="pdf-preview-info">
                            {numPages > 0 && <span>Total: {numPages} pages</span>}
                            {selectedPages.length > 0 && (
                                <span className="selected-count">Selected: {selectedPages.length}</span>
                            )}
                        </div>

                        <div className="pdf-preview-actions">
                            <Button
                                text={selectedPages.length === numPages ? 'Deselect All' : 'Select All'}
                                onClick={selectAllPages}
                                colorScheme="blue-600"
                                variant="gradient"
                                font="lg"
                                squircle="3xl"
                                width="150px"
                                height="45px"
                                type="button"
                                textColor="white-900"
                            />

                            {selectedPages.length >= 2 && (
                                <Button
                                    text={`Merge ${selectedPages.length} Pages`}
                                    onClick={handleMergeSelected}
                                    colorScheme="lime-400"
                                    variant="gradient"
                                    font="lg"
                                    squircle="3xl"
                                    width="150px"
                                    height="45px"
                                    type="button"
                                    textColor="black-900"
                                />
                            )}

                            <Button
                                text="Split All"
                                onClick={handleSplitAll}
                                colorScheme="purple-600"
                                variant="gradient"
                                font="lg"
                                squircle="3xl"
                                width="150px"
                                height="45px"
                                type="button"
                                textColor="white-900"
                            />
                        </div>
                    </div>

                    <div className="pdf-pages-grid">
                        {pageElements.map((pageNum) => (
                            <div
                                key={pageNum}
                                className={`pdf-page-item ${selectedPages.includes(pageNum) ? 'selected' : ''}`}
                                onClick={() => togglePageSelection(pageNum)}
                            >
                                <div className="pdf-page-preview">
                                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                        <div style={{ width: '165px', height: '250px' }}>
                                            <Viewer
                                                fileUrl={documentUrl}
                                                defaultScale={0.3}
                                                initialPage={pageNum - 1}
                                            />
                                        </div>
                                    </Worker>
                                </div>
                                <div className="pdf-page-number">Page {pageNum}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side - Full Preview */}
                <div className="pdf-preview-right">
                    <div className="pdf-full-preview">
                        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                            <Viewer
                                fileUrl={documentUrl}
                                onDocumentLoad={handleDocumentLoad}
                            />
                        </Worker>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;