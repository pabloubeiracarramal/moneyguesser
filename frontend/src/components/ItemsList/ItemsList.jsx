import { useRef } from 'react';
import './ItemsList.css';

export default function ItemsList({ 
  localItems, 
  roomItems, 
  editingItemId,
  onEditItem, 
  onRemoveItem,
  onExport,
  onImport
}) {
  const fileInputRef = useRef(null);
  const allItems = [...localItems, ...roomItems];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  if (allItems.length === 0) {
    return (
      <div className="items-section">
        <div className="section-header">
          <h2>Game Items</h2>
          <div className="items-count">
            <span className="count-badge">0</span>
            <button 
              className="btn-icon btn-import"
              onClick={handleImportClick}
              title="Import items from JSON file"
            >
              📥
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="items-container">
          <div className="empty-state">
            <p>No items yet</p>
            <p className="hint">Add items using the form →</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="items-section">
      <div className="section-header">
        <h2>Game Items</h2>
        <div className="items-count">
          <span className="count-badge">{allItems.length}</span>
          <button 
            className="btn-icon btn-export"
            onClick={onExport}
            title="Export items to JSON file"
          >
            📤
          </button>
          <button 
            className="btn-icon btn-import"
            onClick={handleImportClick}
            title="Import items from JSON file"
          >
            📥
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="items-container">
        <div className="items-group">
          <div className="items-list">
            <div 
              className={`item-card add-new ${editingItemId === null ? 'selected' : ''}`}
              onClick={() => onEditItem({ id: null })}
            >
              <div className="item-label add-new-label">+ Add new item</div>
            </div>
            {localItems.map((item) => (
              <div 
                key={item.id} 
                className={`item-card editable ${editingItemId === item.id ? 'selected' : ''}`}
                onClick={() => onEditItem(item)}
              >
                <div className="item-label">{item.label}</div>
                <button 
                  className="btn-icon btn-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {roomItems.map((item, index) => (
              <div key={item.id || index} className="item-card confirmed">
                <div className="item-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
