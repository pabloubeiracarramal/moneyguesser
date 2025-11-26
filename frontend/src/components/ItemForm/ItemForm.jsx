import { useState, useEffect } from 'react';
import './ItemForm.css';

export default function ItemForm({ 
  editingItem,
  onSubmit,
  onCancelEdit,
  disabled 
}) {
  const [itemLabel, setItemLabel] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // Update form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setItemLabel(editingItem.label);
      setItemImageUrl(editingItem.imageUrl);
      setItemPrice(editingItem.price);
    } else {
      setItemLabel('');
      setItemImageUrl('');
      setItemPrice('');
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const result = onSubmit({
      label: itemLabel.trim(),
      imageUrl: itemImageUrl.trim(),
      price: itemPrice
    });

    // Clear form if submission was successful
    if (result !== false) {
      setItemLabel('');
      setItemImageUrl('');
      setItemPrice('');
    }
  };

  const handleCancel = () => {
    setItemLabel('');
    setItemImageUrl('');
    setItemPrice('');
    onCancelEdit();
  };

  return (
    <div className="form-section">
      <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
      
      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="itemLabel">Item Name</label>
            <input
              id="itemLabel"
              type="text"
              placeholder="e.g., Laptop"
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="itemImageUrl">Image URL</label>
            <input
              id="itemImageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="form-group">
            <label htmlFor="itemPrice">Price</label>
            <input
              id="itemPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="19.99"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="image-preview">
          {itemImageUrl ? (
            <img 
              src={itemImageUrl} 
              alt="Preview"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Image preview</span>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-secondary" disabled={disabled}>
            {editingItem ? '✓ Update Item' : '+ Add to List'}
          </button>
          {editingItem && (
            <button 
              type="button" 
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={disabled}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
