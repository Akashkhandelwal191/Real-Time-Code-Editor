import './App.css';
import { Routes,Route } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import EditorPage from './Pages/EditorPage';

function App() {
  return (
    <>
        <Routes>
               <Route path="/" element={<HomePage/>}></Route>
               <Route path="/editor/:roomId" element={<EditorPage/>}></Route>
         </Routes>
    </>
  );
}

export default App;
