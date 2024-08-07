import React, { useState, useEffect, useCallback } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";

let client;

function App() {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [role, setRole] = useState(null);
  const [category, setCategory] = useState(null);
  const [item, setItem] = useState(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const [numericId, setNumericId] = useState(null);
  const [players, setPlayers] = useState([]);

  const connectWebSocket = useCallback(() => {
    client = new W3CWebSocket('ws://localhost:8000/ws/' + Math.random().toString(36).substr(2, 9));

    client.onopen = () => {
      console.log('WebSocket Client Connected');
      setConnected(true);
    };

    client.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log('Received:', data);

      switch(data.action) {
        case 'set_id':
          setNumericId(data.numeric_id);
          break;
        case 'room_created':
          setRoomId(data.room_id);
          break;
        case 'joined_room':
          setRoomId(data.room_id);
          break;
        case 'room_status':
          setPlayers(data.players);
          break;
        case 'role_assigned':
          setRole(data.role);
          setCategory(data.category);
          if (data.role === 'citizen') {
            setItem(data.item);
          }
          setGameStarted(true);
          break;
        case 'reset_connection':
          client.close();
          setConnected(false);
          setRoomId(null);
          setGameStarted(false);
          setRole(null);
          setCategory(null);
          setItem(null);
          setPlayers([]);
          setNumericId(null);
          connectWebSocket();
          break;
        default:
          console.log('Unknown action:', data.action);
      }
    };

    client.onclose = () => {
      console.log('WebSocket Client Disconnected');
      setConnected(false);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const createRoom = useCallback(() => {
    client.send(JSON.stringify({action: 'create_room'}));
  }, []);

  const joinRoom = useCallback(() => {
    if (inputRoomId) {
      client.send(JSON.stringify({action: 'join_room', room_id: inputRoomId}));
    }
  }, [inputRoomId]);

  const startGame = useCallback(() => {
    if (roomId) {
      client.send(JSON.stringify({action: 'start_game', room_id: roomId}));
    }
  }, [roomId]);

  const resetConnections = useCallback(() => {
    client.send(JSON.stringify({action: 'reset_connections'}));
  }, []);

  const goToMainMenu = useCallback(() => {
    setRoomId(null);
    setGameStarted(false);
    setRole(null);
    setCategory(null);
    setItem(null);
    setPlayers([]);
  }, []);

  const renderHeader = () => (
    <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gray-800 text-white">
      <button 
        onClick={goToMainMenu}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        메인 메뉴
      </button>
      <div>클라이언트 ID: {numericId}</div>
      <button 
        onClick={resetConnections}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        모든 연결 리셋
      </button>
    </header>
  );

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-bold text-gray-800 animate-pulse">Connecting...</div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        {renderHeader()}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">마피아 게임</h1>
          <button 
            onClick={createRoom}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 mb-4"
          >
            방 만들기
          </button>
          <div className="flex items-center">
            <input 
              type="text" 
              placeholder="방 ID" 
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="flex-grow mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={joinRoom}
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200"
            >
              방 참여
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        {renderHeader()}
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4 text-gray-800">방 ID: {roomId}</h2>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">접속자 목록:</h3>
            <ul>
              {players.map((player) => (
                <li key={player.client_id}>플레이어 {player.numeric_id}</li>
              ))}
            </ul>
          </div>
          <button 
            onClick={startGame}
            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200"
          >
            게임 시작
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      {renderHeader()}
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">게임 시작!</h2>
        <p className="text-xl mb-2">당신의 역할: <span className="font-bold text-blue-600">{role === 'mafia' ? '마피아' : '시민'}</span></p>
        <p className="text-xl mb-2">카테고리: <span className="font-bold text-green-600">{category}</span></p>
        {role === 'citizen' && <p className="text-lg">항목: <span className="font-bold text-purple-600">{item}</span></p>}
      </div>
    </div>
  );
}

export default App;