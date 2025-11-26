import { useState, useEffect } from 'react';
import { addItem, startGame, updateRoomSettings } from '../../services/api';
import RoundConfiguration from '../RoundConfiguration/RoundConfiguration';
import ItemsList from '../ItemsList/ItemsList';
import ItemForm from '../ItemForm/ItemForm';
import './HostLobbyView.css';

export default function HostLobbyView({ room, roomCode, token, onRoomUpdate }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roundDuration, setRoundDuration] = useState(room?.roundDurationSeconds || 30);
  
  // Local items staging
  const [localItems, setLocalItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);

  // Update round duration when room changes
  useEffect(() => {
    if (room?.roundDurationSeconds) {
      setRoundDuration(room.roundDurationSeconds);
    }
  }, [room?.roundDurationSeconds]);

  const handleRoundDurationChange = async (newDuration) => {
    setRoundDuration(newDuration);
    
    // Debounce the API call
    if (window.roundDurationTimeout) {
      clearTimeout(window.roundDurationTimeout);
    }
    
    window.roundDurationTimeout = setTimeout(async () => {
      try {
        await updateRoomSettings(roomCode, token, newDuration);
      } catch (err) {
        console.error('Failed to update round duration:', err);
        setError(err.message);
      }
    }, 500);
  };

  const handleAddItem = ({ label, imageUrl, price }) => {
    if (!label || !imageUrl || !price) {
      setError('All item fields are required');
      return false;
    }

    const priceCents = Math.round(parseFloat(price) * 100);
    
    if (priceCents < 0) {
      setError('Price must be positive');
      return false;
    }

    setError('');

    if (editingItemId !== null) {
      // Update existing item
      setLocalItems(items => 
        items.map(item => 
          item.id === editingItemId
            ? { ...item, label, imageUrl, priceCents }
            : item
        )
      );
      setEditingItemId(null);
    } else {
      // Add new item
      const newItem = {
        id: Date.now(),
        label,
        imageUrl,
        priceCents
      };
      setLocalItems(items => [...items, newItem]);
    }
    
    return true;
  };

  const handleRemoveItem = (itemId) => {
    setLocalItems(items => items.filter(item => item.id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const getEditingItem = () => {
    if (editingItemId === null) return null;
    const item = localItems.find(item => item.id === editingItemId);
    if (!item) return null;
    return {
      label: item.label,
      imageUrl: item.imageUrl,
      price: (item.priceCents / 100).toString()
    };
  };

  const handleStartGame = async () => {
    const totalItems = localItems.length + (room?.totalRounds || 0);
    
    if (totalItems === 0) {
      setError('Please add at least one item before starting');
      return;
    }

    if (room.players.length === 0) {
      setError('Waiting for at least one player to join');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send any unsent local items first
      if (localItems.length > 0) {
        await Promise.all(
          localItems.map(item => 
            addItem(roomCode, token, item.label, item.imageUrl, item.priceCents)
          )
        );
        setLocalItems([]);
      }
      
      await startGame(roomCode, token);
      // Navigation will happen via WebSocket event
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="host-lobby-view">
      <ItemsList
        localItems={localItems}
        roomItems={room?.items || []}
        editingItemId={editingItemId}
        onEditItem={(item) => {
          if (item.id === null) {
            setEditingItemId(null);
          } else {
            setEditingItemId(item.id);
          }
        }}
        onRemoveItem={handleRemoveItem}
      />

      <ItemForm
        editingItem={getEditingItem()}
        onSubmit={handleAddItem}
        onCancelEdit={handleCancelEdit}
      />

      <RoundConfiguration 
        roundDuration={roundDuration}
        onRoundDurationChange={handleRoundDurationChange}
        totalRounds={room?.totalRounds || 0}
        playersCount={room?.players?.length || 0}
        localItemsCount={localItems.length}
        onStartGame={handleStartGame}
        loading={loading}
        error={error}
      />
    </div>
  );
}
