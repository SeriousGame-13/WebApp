import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
function Page (data) {
    const userData = data;

    return (
        <div className="AppContents">
            This is Challenge Page
        </div>
    )
}
const ChallengePageElements = {
    Page
};

export default ChallengePageElements;