import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';
import Button from '@/shared/components/widgets/button/Button';
import { BUTTON_PROPS } from '../../constants/equipment.constant';
import { findEquipmentWithImages } from '../../helper/equipment.helper';

const getImageUrl = (img) => img?.s3Url?.trim() || img?.url?.trim() || '';

const toImageFiles = (fileList) => Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));

const putFile = async (uploadUrl, file) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) throw new Error('File upload failed');
};

const SHIFT_STEP = 5;

const toPngBlob = async (blob) => {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Convert failed'))), 'image/png');
  });
};

const postJson = async (url, body) => {
  const response = await apiRequest(url, 'POST', body);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
};

function FullscreenViewer({
  imageIndex,
  equipment,
  clickPosition,
  filteredData,
  mode,
  onClose,
  onSetImage,
  onSetImageIndex,
  onSetEquipment,
  onSetMode,
  onRefreshImages,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) {
  const [menu, setMenu] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const addInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetRef = useRef(null);
  const keyHandlerRef = useRef(null);
  const waitingForMoreRef = useRef(false);
  const [selectedPending, setSelectedPending] = useState(0);
  const [pendingDragFrom, setPendingDragFrom] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pendingOrderRef = useRef(null);

  const notify = (text, isError = false) => {
    clearTimeout(noticeTimerRef.current);
    setNotice({ text, isError });
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2500);
  };

  const flushOrder = () => {
    clearTimeout(saveTimerRef.current);
    const pending = pendingOrderRef.current;
    if (!pending) return;
    pendingOrderRef.current = null;
    postJson('/equipments/reorder-equipment-images', pending)
      .catch((err) => setError(err.message))
      .finally(() => onRefreshImages(pending.equipmentNo));
  };

  const images = equipment?.equipmentImage || [];
  const isAddMode = mode === 'add' || images.length === 0;
  const isAddOpen = !!equipment && isAddMode;

  const addFiles = (fileList) => {
    const files = toImageFiles(fileList);
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removePending = (index) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearPending = () => {
    pendingFiles.forEach((item) => URL.revokeObjectURL(item.url));
    setPendingFiles([]);
  };

  useEffect(() => {
    if (!isAddOpen) return undefined;
    const handlePaste = (e) => addFiles(e.clipboardData?.files);
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isAddOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => keyHandlerRef.current?.(e);
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!waitingForMoreRef.current || !equipment) return;

    const currentIndex = filteredData.findIndex((eq) => eq.regNo === equipment.regNo);
    const found = findEquipmentWithImages(filteredData, currentIndex + 1, 1);

    if (found) {
      waitingForMoreRef.current = false;
      onSetEquipment(found);
      onSetImageIndex(0);
      onSetImage(found.equipmentImage[0]);
      notify(`Next batch loaded: ${found.machine} - ${found.regNo}`);
    } else if (!isLoadingMore && hasMore) {
      onLoadMore();
    } else if (!isLoadingMore) {
      waitingForMoreRef.current = false;
      notify('No more equipment with images');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, isLoadingMore]);

  if (!equipment) return null;

  const current = images[Math.min(imageIndex, images.length - 1)];

  const run = async (task) => {
    setIsBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleClose = () => {
    waitingForMoreRef.current = false;
    flushOrder();
    clearPending();
    setMenu(null);
    const overlay = document.querySelector('.fleet.equipment.fullscreen-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(onClose, 400);
    }
  };

  const navigate = (direction) => {
    let newIndex = imageIndex + direction;
    let newEquipment = equipment;

    const currentEquipmentIndex = filteredData.findIndex((eq) => eq.regNo === equipment.regNo);

    if (newIndex >= images.length) {
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex + 1, 1);
      if (!found) {
        if (hasMore) {
          if (!isLoadingMore) {
            waitingForMoreRef.current = true;
            onLoadMore();
          }
          notify('End of this batch, loading more equipment...');
        } else {
          notify('You reached the last image of the last equipment');
        }
        return;
      }
      flushOrder();
      newEquipment = found;
      newIndex = 0;
      onSetEquipment(found);
      notify(`Next equipment: ${found.machine} - ${found.regNo}`);
    } else if (newIndex < 0) {
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex - 1, -1);
      if (!found) {
        notify('You reached the first image of the first equipment');
        return;
      }
      flushOrder();
      newEquipment = found;
      newIndex = found.equipmentImage.length - 1;
      onSetEquipment(found);
      notify(`Previous equipment: ${found.machine} - ${found.regNo}`);
    }

    onSetImageIndex(newIndex);
    onSetImage(newEquipment.equipmentImage[newIndex]);
  };

  const handleDelete = (img) => {
    if (!window.confirm('Delete this image?')) return;
    run(async () => {
      await postJson('/equipments/delete-equipment-image', { equipmentNo: equipment.regNo, path: img.path });
      const updated = await onRefreshImages(equipment.regNo);
      onSetImageIndex(Math.max(0, Math.min(imageIndex, updated.length - 1)));
    });
  };

  const handleReplaceFile = (e) => {
    const file = toImageFiles(e.target.files)[0];
    e.target.value = '';
    const target = replaceTargetRef.current;
    if (!file || !target) return;

    run(async () => {
      const data = await postJson('/equipments/replace-equipment-image', {
        equipmentNo: equipment.regNo,
        path: target.path,
        file: { fileName: file.name, mimeType: file.type },
      });
      await putFile(data.data.uploadUrl, file);
      await onRefreshImages(equipment.regNo);
    });
  };

  const handleDropOnThumb = (to) => {
    const from = dragFrom;
    setDragFrom(null);
    setDragOver(null);
    reorderTo(from, to);
  };

  const reorderTo = (from, to) => {
    if (from === null || from === to) return;
    const target = Math.max(0, Math.min(to, images.length - 1));
    if (target === from) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(target, 0, moved);

    onSetEquipment({ ...equipment, equipmentImage: reordered });
    onSetImageIndex(target);

    pendingOrderRef.current = { equipmentNo: equipment.regNo, paths: reordered.map((img) => img.path) };
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushOrder, 700);
  };

  const handleUpload = () => {
    if (!pendingFiles.length) return;
    run(async () => {
      const data = await postJson('/equipments/add-equipment-image', {
        equipmentNo: equipment.regNo,
        files: pendingFiles.map(({ file }) => ({
          fileName: file.name,
          mimeType: file.type,
          label: file.name.replace(/\.[^.]+$/, ''),
        })),
      });
      await Promise.all(data.data.uploadData.map((upload, i) => putFile(upload.uploadUrl, pendingFiles[i].file)));
      clearPending();
      const updated = await onRefreshImages(equipment.regNo);
      onSetImageIndex(Math.max(0, updated.length - 1));
      onSetMode('view');
    });
  };

  const handleCancelAdd = () => {
    clearPending();
    setError('');
    onSetMode('view');
  };

  const activePending = Math.min(selectedPending, pendingFiles.length - 1);

  const movePending = (from, to) => {
    if (from === null || from === to) return;
    const target = Math.max(0, Math.min(to, pendingFiles.length - 1));
    if (target === from) return;

    setPendingFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setSelectedPending(target);
  };

  const copyImage = async (img) => {
    try {
      const response = await fetch(getImageUrl(img));
      const blob = await response.blob();
      const pngBlob = blob.type === 'image/png' ? blob : await toPngBlob(blob);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      notify('Image copied');
    } catch {
      notify('Could not copy the image', true);
    }
  };

  keyHandlerRef.current = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    if (menu || isBusy) return;
    e.preventDefault();

    const total = isAddMode ? pendingFiles.length : images.length;
    const from = isAddMode ? activePending : imageIndex;
    const step = e.shiftKey ? SHIFT_STEP : 1;

    let to = from;
    if (e.key === 'ArrowLeft') to = from - step;
    else if (e.key === 'ArrowRight') to = from + step;
    else if (e.key === 'Home') to = 0;
    else to = total - 1;

    if (isAddMode) movePending(from, to);
    else reorderTo(from, to);
  };

  const handleDropFiles = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    addFiles(e.dataTransfer.files);
  };

  const openMenu = (e, img, index) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, img, index });
  };

  return (
    <div
      className="fleet equipment fullscreen-overlay"
      onClick={() => (menu ? setMenu(null) : handleClose())}
      style={{ '--click-x': `${clickPosition.x}px`, '--click-y': `${clickPosition.y}px` }}
    >
      {notice && (
        <div className={`fleet equipment viewer-notice${notice.isError ? ' error' : ''}`}>{notice.text}</div>
      )}

      <div className="fleet equipment fullscreen-header">
        <h2>{equipment.machine} - {equipment.regNo}{isAddMode ? ' · Add Image' : ''}</h2>
        {!isAddMode && (
          <span className="fleet equipment image-counter">
            {imageIndex + 1} / {images.length}
          </span>
        )}
      </div>

      <div
        className="fleet equipment fullscreen-content"
        onClick={(e) => { e.stopPropagation(); setMenu(null); }}
      >
        <button className="fleet equipment fullscreen-close" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <input ref={addInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={replaceInputRef} type="file" accept="image/*" hidden onChange={handleReplaceFile} />

        {isAddMode ? (
          <>
            <div className="fleet equipment fullscreen-image-container with-footer">
              <div
                className={`fleet equipment add-dropzone${isDraggingFile ? ' dragging' : ''}`}
                onClick={() => addInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDropFiles}
              >
                <span className="material-symbols-rounded">upload_file</span>
                <p>Open the File or Drag the file to here</p>
                <span className="fleet equipment add-dropzone-or">or</span>
                <p>Copy and paste here</p>
              </div>
            </div>

            <div className="fleet equipment add-footer">
              {error && <div className="fleet equipment viewer-error">{error}</div>}

              {pendingFiles.length > 0 && (
                <div className="fleet equipment pending-list">
                  {pendingFiles.map((item, index) => (
                    <div
                      key={item.url}
                      className={`fleet equipment pending-item${index === activePending ? ' active' : ''}`}
                      draggable
                      onClick={() => setSelectedPending(index)}
                      onDragStart={() => setPendingDragFrom(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); movePending(pendingDragFrom, index); setPendingDragFrom(null); }}
                      onDragEnd={() => setPendingDragFrom(null)}
                    >
                      <img src={item.url} alt={item.file.name} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); removePending(index); }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="fleet equipment add-footer-actions">
                {images.length > 0 && (
                  <Button
                    {...BUTTON_PROPS}
                    text="Cancel"
                    onClick={handleCancelAdd}
                    disabled={isBusy}
                    colorScheme="black-200"
                    textColor="white-200"
                    width="140px"
                    height="44px"
                  />
                )}
                <Button
                  {...BUTTON_PROPS}
                  text={isBusy ? 'Uploading...' : `Upload${pendingFiles.length ? ` (${pendingFiles.length})` : ''}`}
                  componentIconLeft="IconlyPlus"
                  componentIconSize="25"
                  iconColor="white-200"
                  onClick={handleUpload}
                  disabled={isBusy || !pendingFiles.length}
                  colorScheme="success-800"
                  textColor="white-200"
                  width="180px"
                  height="44px"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="fleet equipment fullscreen-image-container with-thumbs">
              <div className="fleet equipment preview-stack">
                {images.map((img, index) => {
                  const offset = index - imageIndex;
                  const position = offset < 0 ? 'past' : offset === 0 ? 'front' : offset > 4 ? 'far' : '';
                  return (
                    <img
                      key={img.path || index}
                      src={getImageUrl(img)}
                      alt={img.label || equipment.machine}
                      className={`fleet equipment preview-image ${position}`}
                      style={{ '--offset': offset, zIndex: offset < 0 ? 0 : images.length - offset }}
                      onContextMenu={(e) => offset === 0 && openMenu(e, img, index)}
                    />
                  );
                })}
              </div>
            </div>

            <button className="fleet equipment fullscreen-nav prev" onClick={() => navigate(-1)}>
              <span className="material-symbols-rounded">chevron_left</span>
            </button>

            <button className="fleet equipment fullscreen-nav next" onClick={() => navigate(1)}>
              <span className="material-symbols-rounded">chevron_right</span>
            </button>

            {error && <div className="fleet equipment viewer-error floating">{error}</div>}

            <div className="fleet equipment thumb-strip">
              {images.map((img, index) => (
                <div
                  key={img.path || index}
                  className={`fleet equipment thumb${index === imageIndex ? ' active' : ''}${dragOver === index && dragFrom !== index ? ' drag-over' : ''}`}
                  draggable={!isBusy}
                  onClick={() => { onSetImageIndex(index); onSetImage(img); }}
                  onContextMenu={(e) => openMenu(e, img, index)}
                  onDragStart={() => setDragFrom(index)}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
                  onDrop={(e) => { e.preventDefault(); handleDropOnThumb(index); }}
                  onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
                >
                  <img src={getImageUrl(img)} alt={img.label || ''} />
                </div>
              ))}

              <button type="button" className="fleet equipment thumb-add" onClick={() => onSetMode('add')}>
                + Add Image
              </button>
            </div>
          </>
        )}
      </div>

      {menu && (
        <div
          className="fleet equipment viewer-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              replaceTargetRef.current = menu.img;
              setMenu(null);
              replaceInputRef.current?.click();
            }}
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => {
              const target = menu.img;
              setMenu(null);
              copyImage(target);
            }}
          >
            Copy image
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              const target = menu.img;
              setMenu(null);
              handleDelete(target);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default FullscreenViewer;