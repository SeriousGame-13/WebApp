import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';

function Page (data) {
    const userData = data;

    return (
        <div className="AppContents">
            This is Ranking Page
        </div>
    )
}

const RankingPageElements = {
    Page
};

export default RankingPageElements;