import React from 'react';
import TableContainer from '../components/TableContainer';

const PlatformPage = ({
    videosData,
    usersData,
    userVideosData,
    isLoading,
    platform,
    onSearch,
    onTrending,
    onClearData,
    onSettingsChange
}) => {
    return (
        <div className="platform-page">
            <TableContainer
                videosData={videosData}
                usersData={usersData}
                userVideosData={userVideosData}
                isLoading={isLoading}
                platform={platform}
                onSearch={onSearch}
                onTrending={onTrending}
                onClearData={onClearData}
                onSettingsChange={onSettingsChange}
            />
        </div>
    );
};

export default PlatformPage;