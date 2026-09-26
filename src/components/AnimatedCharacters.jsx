import React, { useEffect, useRef, useState } from "react";

function Pupil({ size = 12, maxDistance = 5, pupilColor = "#1f2940", forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(event) {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function calculatePupilPosition() {
    if (!pupilRef.current) {
      return { x: 0, y: 0 };
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const centerX = pupil.left + pupil.width / 2;
    const centerY = pupil.top + pupil.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "999px",
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out"
      }}
    />
  );
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "#1f2940",
  isBlinking = false,
  forceLookX,
  forceLookY
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(event) {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function calculatePupilPosition() {
    if (!eyeRef.current) {
      return { x: 0, y: 0 };
    }

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const centerX = eye.left + eye.width / 2;
    const centerY = eye.top + eye.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        borderRadius: "999px",
        backgroundColor: eyeColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "all 0.15s ease"
      }}
    >
      {!isBlinking ? (
        <div
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            borderRadius: "999px",
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out"
          }}
        />
      ) : null}
    </div>
  );
}

export default function AnimatedCharacters({
  isTyping = false,
  isUsernameFocused = false,
  isPasswordFocused = false,
  showPassword = false,
  passwordLength = 0
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(event) {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let timeoutId;

    function scheduleBlink() {
      timeoutId = window.setTimeout(() => {
        setIsPurpleBlinking(true);
        window.setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
    }

    scheduleBlink();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let timeoutId;

    function scheduleBlink() {
      timeoutId = window.setTimeout(() => {
        setIsBlackBlinking(true);
        window.setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, Math.random() * 4000 + 3000);
    }

    scheduleBlink();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isTyping) {
      setIsLookingAtEachOther(false);
      return undefined;
    }

    setIsLookingAtEachOther(true);
    const timer = window.setTimeout(() => {
      setIsLookingAtEachOther(false);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [isTyping]);

  // 交互逻辑：
  // 1. 没有选中任何输入框时：眼睛跟随鼠标
  // 2. 选中用户名输入框时：看向用户名输入框位置
  // 3. 选中密码框时：背过身去，不看向密码框方向
  const isHidingPassword = isPasswordFocused && !showPassword;
  const isPeekingPassword = showPassword && passwordLength > 0;
  const isLookingAtUsername = isUsernameFocused && !isPasswordFocused;

  useEffect(() => {
    if (!isPeekingPassword) {
      setIsPurplePeeking(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsPurplePeeking(true);
      window.setTimeout(() => {
        setIsPurplePeeking(false);
      }, 800);
    }, Math.random() * 3000 + 2000);

    return () => window.clearTimeout(timer);
  }, [isPeekingPassword, isPurplePeeking]);

  function calculatePosition(ref) {
    if (!ref.current) {
      return { faceX: 0, faceY: 0, bodySkew: 0 };
    }

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    return {
      faceX: Math.max(-15, Math.min(15, deltaX / 20)),
      faceY: Math.max(-10, Math.min(10, deltaY / 30)),
      bodySkew: Math.max(-6, Math.min(6, -deltaX / 120))
    };
  }

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  return (
    <div className="login-characters" style={{ width: "100%", maxWidth: "520px", height: "360px", position: "relative" }}>
      <div
        ref={purpleRef}
        style={{
          position: "absolute",
          left: "68px",
          bottom: 0,
          width: "172px",
          height: isTyping || isHidingPassword ? "390px" : "350px",
          borderRadius: "12px 12px 0 0",
          backgroundColor: "#6b54e8",
          zIndex: 1,
          transform: isPeekingPassword
            ? "skewX(0deg)"
            : isTyping || isHidingPassword
              ? "skewX(-15deg) translateX(34px)"
              : `skewX(${purplePos.bodySkew}deg)`,
          transformOrigin: "bottom center",
          transition: "all 0.7s ease"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: isPeekingPassword ? "18px" : isHidingPassword ? "22px" : isLookingAtUsername ? "28px" : isLookingAtEachOther ? "52px" : `${42 + purplePos.faceX}px`,
            top: isPeekingPassword ? "34px" : isHidingPassword ? "28px" : isLookingAtUsername ? "54px" : isLookingAtEachOther ? "62px" : `${38 + purplePos.faceY}px`,
            display: "flex",
            gap: "28px",
            transition: "all 0.7s ease"
          }}
        >
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={isPeekingPassword ? (isPurplePeeking ? 4 : -4) : isHidingPassword ? 0 : isLookingAtUsername ? -6 : isLookingAtEachOther ? 3 : undefined}
            forceLookY={isPeekingPassword ? (isPurplePeeking ? 5 : -4) : isHidingPassword ? -8 : isLookingAtUsername ? 5 : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall
            size={18}
            pupilSize={7}
            maxDistance={5}
            isBlinking={isPurpleBlinking}
            forceLookX={isPeekingPassword ? (isPurplePeeking ? 4 : -4) : isHidingPassword ? 0 : isLookingAtUsername ? -6 : isLookingAtEachOther ? 3 : undefined}
            forceLookY={isPeekingPassword ? (isPurplePeeking ? 5 : -4) : isHidingPassword ? -8 : isLookingAtUsername ? 5 : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      <div
        ref={blackRef}
        style={{
          position: "absolute",
          left: "226px",
          bottom: 0,
          width: "116px",
          height: "278px",
          borderRadius: "8px 8px 0 0",
          backgroundColor: "#1d2538",
          zIndex: 2,
          transform: isPeekingPassword
            ? "skewX(0deg)"
            : isLookingAtEachOther
              ? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(18px)`
              : isTyping || isHidingPassword
                ? `skewX(${blackPos.bodySkew * 1.5}deg)`
                : `skewX(${blackPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
          transition: "all 0.7s ease"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: isPeekingPassword ? "10px" : isHidingPassword ? "14px" : isLookingAtUsername ? "18px" : isLookingAtEachOther ? "30px" : `${24 + blackPos.faceX}px`,
            top: isPeekingPassword ? "26px" : isHidingPassword ? "22px" : isLookingAtUsername ? "40px" : isLookingAtEachOther ? "12px" : `${30 + blackPos.faceY}px`,
            display: "flex",
            gap: "20px",
            transition: "all 0.7s ease"
          }}
        >
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={isPeekingPassword ? -4 : isHidingPassword ? 0 : isLookingAtUsername ? -5 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -7 : isLookingAtUsername ? 4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall
            size={16}
            pupilSize={6}
            maxDistance={4}
            isBlinking={isBlackBlinking}
            forceLookX={isPeekingPassword ? -4 : isHidingPassword ? 0 : isLookingAtUsername ? -5 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -7 : isLookingAtUsername ? 4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      <div
        ref={orangeRef}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "220px",
          height: "184px",
          borderRadius: "120px 120px 0 0",
          backgroundColor: "#ff9a61",
          zIndex: 3,
          transform: isPeekingPassword ? "skewX(0deg)" : `skewX(${orangePos.bodySkew}deg)`,
          transformOrigin: "bottom center",
          transition: "all 0.7s ease"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: isPeekingPassword ? "48px" : isHidingPassword ? "60px" : isLookingAtUsername ? "56px" : `${78 + orangePos.faceX}px`,
            top: isPeekingPassword ? "82px" : isHidingPassword ? "90px" : isLookingAtUsername ? "98px" : `${86 + orangePos.faceY}px`,
            display: "flex",
            gap: "24px",
            transition: "all 0.2s ease-out"
          }}
        >
          <Pupil forceLookX={isPeekingPassword ? -5 : isHidingPassword ? 0 : isLookingAtUsername ? -2 : undefined} forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -25 : isLookingAtUsername ? 3 : undefined} />
          <Pupil forceLookX={isPeekingPassword ? -5 : isHidingPassword ? 0 : isLookingAtUsername ? -2 : undefined} forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -25 : isLookingAtUsername ? 3 : undefined} />
        </div>
      </div>

      <div
        ref={yellowRef}
        style={{
          position: "absolute",
          left: "288px",
          bottom: 0,
          width: "138px",
          height: "214px",
          borderRadius: "72px 72px 0 0",
          backgroundColor: "#e3cf56",
          zIndex: 4,
          transform: isPeekingPassword ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew}deg)`,
          transformOrigin: "bottom center",
          transition: "all 0.7s ease"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: isPeekingPassword ? "20px" : isHidingPassword ? "28px" : isLookingAtUsername ? "36px" : `${50 + yellowPos.faceX}px`,
            top: isPeekingPassword ? "34px" : isHidingPassword ? "42px" : isLookingAtUsername ? "50px" : `${38 + yellowPos.faceY}px`,
            display: "flex",
            gap: "18px",
            transition: "all 0.2s ease-out"
          }}
        >
          <Pupil forceLookX={isPeekingPassword ? -5 : isHidingPassword ? 0 : isLookingAtUsername ? -2 : undefined} forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -15 : isLookingAtUsername ? 3 : undefined} />
          <Pupil forceLookX={isPeekingPassword ? -5 : isHidingPassword ? 0 : isLookingAtUsername ? -2 : undefined} forceLookY={isPeekingPassword ? -4 : isHidingPassword ? -15 : isLookingAtUsername ? 3 : undefined} />
        </div>
        <div
          style={{
            position: "absolute",
            left: isPeekingPassword ? "10px" : isHidingPassword ? "24px" : isLookingAtUsername ? "26px" : `${38 + yellowPos.faceX}px`,
            top: isPeekingPassword ? "84px" : isHidingPassword ? "88px" : isLookingAtUsername ? "92px" : `${84 + yellowPos.faceY}px`,
            width: "44px",
            height: "4px",
            borderRadius: "999px",
            backgroundColor: "#1f2940",
            transition: "all 0.2s ease-out"
          }}
        />
      </div>
    </div>
  );
}
