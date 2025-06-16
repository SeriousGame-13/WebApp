import '../styles/ExpBar.css';
import React, { useState, useEffect } from 'react';

function NewLinearExpContainer({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="LinearExpContainer">
            <div className="LinearExpBar">
                <div 
                    className="LinearExpFill" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

function NewLinearExpContainerSimple({ expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="LinearExpContainerSimple">
            <div className="LinearExpBarSimple">
                <div 
                    className="LinearExpFillSimple" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

function NewLinearExpContainerWithProgress ({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    
    return (
        <div className="LinearExpContainer">
            <div className="Stats">Level {level} | Experience: {expnow} / {expmax}</div>
            <div className="LinearExpBar">
                <div 
                    className="LinearExpFill" 
                    style={{ width: `${progress}%` }}
                ></div>
                <div className="LinearExpText">{Math.round(progress)}%</div>
            </div>
        </div>
    );
}

function NewCircleExpContainer({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    const circumference = 2 * Math.PI * 125;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <div className="CircularExpContainer">
            <div className="CircularExpBar">
                <svg className="CircularExpSvg" viewBox="0 0 300 300">
                    <circle className="CircularBg" cx="50%" cy="50%" r="125"></circle>
                    <circle 
                        className="CircularProgress" 
                        cx="50%" 
                        cy="50%" 
                        r="125"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset
                        }}
                    ></circle>
                </svg>
                <div className="CircularExpText">
                    <div className='LevelTitle'>Lv</div>
                    <div className="Level">{level}</div>
                </div>
            </div>
        </div>
    );
}

function NewCircleExpContainerWithProgress({ level, expnow, expmax }) {
    const progress = Math.min((expnow / expmax) * 100, 100);
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <div className="CircularExpContainer">
            <div className="CircularExpBar">
                <svg className="CircularExpSvg">
                    <circle className="CircularBg" cx="100" cy="100" r="85"></circle>
                    <circle 
                        className="SircularProgress" 
                        cx="100" 
                        cy="100" 
                        r="85"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset
                        }}
                    ></circle>
                </svg>
                <div className="CircularExpText">
                    <div className="Level">LV {level}</div>
                    <div className="Progress">{Math.round(progress)}%</div>
                </div>
            </div>
            <div className="Stats">Experience: {expnow} / {expmax}</div>
        </div>
    );
}

function TestExpContainer () {
    const [levelnow, setlevel] = useState(0);
    const [expnow, setexp] = useState(0);
    const expmax = 100;

    useEffect(() => {
        const interval = setInterval(() => {
            setexp(prevExp => {
                if (prevExp + 10 >= expmax) {
                    // Level up
                    setlevel(prevLevel => prevLevel + 1);
                    return 0; // Reset experience
                }
                return prevExp + 10;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [expmax]); // Add expmax as a dependency

    return (
        <div>
            <NewCircleExpContainer level={levelnow} expnow={expnow} expmax={expmax} />
            <NewLinearExpContainer level={levelnow} expnow={expnow} expmax={expmax} />
        </div>
    )
}

const ExpElements = {
    NewLinearExpContainer,
    NewLinearExpContainerSimple,
    NewLinearExpContainerWithProgress,
    NewCircleExpContainer,
    NewCircleExpContainerWithProgress,
    TestExpContainer
};

export default ExpElements;