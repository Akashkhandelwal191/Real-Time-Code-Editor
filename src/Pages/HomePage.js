import React from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Preloader from "../components/Preloader";

const HomePage = () => {
  const { t } = useTranslation();
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
            toast.error(t('already_logged_in'));
          } else if (err === 'auth_failed') {
            toast.error(t('auth_failed'));
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
    toast.success(t('created_new_room'));
  };

  const joinRoom = () => {
    if (!user) {
      toast.error(t('please_login_first'));
      window.location.href = '/auth/google';
      return;
    }
    if (!roomId) {
      toast.error(t("room_id_required"));
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
              <h4 className="MainLabel">{t('paste_invitation_room_id')}</h4>
              <div className="InputGroup">
                <input
                  type="text"
                  className="InputBox"
                  placeholder={t('room_id')}
                  onChange={(e) => setRoomId(e.target.value)}
                  value={roomId}
                  onKeyUp={handleInputEnter}
                />
                <button className="btn joinBtn" onClick={joinRoom}>
                  {t('join')}
                </button>
                <span className="createInfo">
                  {t('if_you_dont_have_invite')} &nbsp;
                  <a href="#sf" className="createNewBtn" onClick={createNewRoom}>
                    {t('new_room')}
                  </a>
                </span>
              </div>
            </>
          ) : (
            <div className="InputGroup">
              <button className="btn googleBtn" onClick={handleGoogleLogin}>
                {t('login_with_google')}
              </button>
            </div>
          )}
        </div>

        <footer className="footer">
          <h4>
            {t('created_by')}{" "}
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
