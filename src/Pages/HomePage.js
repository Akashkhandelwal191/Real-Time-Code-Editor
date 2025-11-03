import React from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Preloader from "../components/Preloader";

const HomePage = () => {
  const navigate = useNavigate();
  const [Loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
      const init = async () => {
        try {
          const params = new URLSearchParams(location.search);
          const err = params.get('error');
          if (err === 'already_logged_in') {
            toast.error('You are already logged in on another device/browser.');
          } else if (err === 'auth_failed') {
            toast.error('Authentication failed. Please try again.');
          }
          const res = await fetch('/login/success');
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          }
        } catch (e) {
          // not logged in; ignore
        } finally {
          setTimeout(() => setLoading(false), 800);
        }
      };
      init();
  }, [location.search]);

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!user) {
      toast.error('Please login with Google first');
      window.location.href = '/auth/google';
      return;
    }
    if (!roomId) {
      toast.error("Room Id is required");
      return;
    }
    navigate(`/editor/${roomId}`);
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  if (Loading) {
    return <Preloader />;
  } else {
    return (
      <div className="HomePageWrapper">
        <div className="FormWrapper">
          {user && (
            <div className="UserBar">
              <img
                className="UserAvatar"
                src={user?.photos?.[0]?.value || '/logo192.png'}
                alt={user?.displayName || 'user'}
              />
              <div className="UserMeta">
                <div className="UserName">{user?.displayName}</div>
                <div className="UserEmail">{user?.emails?.[0]?.value}</div>
              </div>
            </div>
          )}
          <img src="/code-sync.png" alt="CodeImage" className="HomePageLogo" />
          {user ? (
            <>
              <h4 className="MainLabel">Paste Invitation Room Id</h4>
              <div className="InputGroup">
                <input
                  type="text"
                  className="InputBox"
                  placeholder="Room Id"
                  onChange={(e) => setRoomId(e.target.value)}
                  value={roomId}
                  onKeyUp={handleInputEnter}
                />
                <button className="btn joinBtn" onClick={joinRoom}>
                  Join
                </button>
                <span className="createInfo">
                  if you don't have invite then create &nbsp;
                  <a href="#sf" className="createNewBtn" onClick={createNewRoom}>
                    new room
                  </a>
                </span>
              </div>
            </>
          ) : (
            <div className="InputGroup">
              <button className="btn googleBtn" onClick={handleGoogleLogin}>
                Login with Google
              </button>
            </div>
          )}
        </div>

        <footer className="footer">
          <h4>
            Created By{" "}
            <a
              className="footer-name"
              href="https://github.com/Akashkhandelwal191"
            >
              Akash Khandelwal ❤
            </a>{" "}
          </h4>
        </footer>
      </div>
    );
  }
};

export default HomePage;
