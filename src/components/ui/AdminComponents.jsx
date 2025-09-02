import { Search, Plus } from 'lucide-react';
import '../../components/styles/sphere-styles.css';

// Admin Page Header Component
export function AdminPageHeader({ title }) {
    return (
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gradient">{title}</h2>
        </div>
    );
}

// Admin Stats Cards Component
export function AdminStatsCards({ stats }) {
    if (!stats || stats.length === 0) return null;

    const gridClass = stats.length === 1 ? 'grid-1' : 
                     stats.length === 2 ? 'grid-2' : 
                     stats.length === 3 ? 'grid-3' : 
                     'grid-4';

    return (
        <div className={`${gridClass} gap-6`}>
            {stats.map((stat, index) => (
                <div key={index} className="card text-center">
                    <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

// Admin Search and Create Component
export function AdminSearchCreate({ 
    searchTerm, 
    onSearchChange, 
    searchPlaceholder = "Search...", 
    onCreateClick, 
    createButtonText = "Create New",
    showCreateButton = true,
    additionalButtons = []
}) {
    return (
        <div className="flex items-center gap-4 mt-4">
            <div className="search-container flex-1">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                />
            </div>
            
            {/* Additional buttons */}
            {additionalButtons.map((button, index) => (
                <button
                    key={index}
                    className={button.className || "btn-secondary"}
                    onClick={button.onClick}
                    disabled={button.disabled}
                >
                    {button.icon && <button.icon className="w-4 h-4 mr-2" />}
                    {button.text}
                </button>
            ))}
            
            {/* Main create button */}
            {showCreateButton && (
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={onCreateClick}
                >
                    <Plus className="w-4 h-4" />
                    {createButtonText}
                </button>
            )}
        </div>
    );
}

// Admin Content List Component
export function AdminContentList({ children, isLoading, emptyMessage = "No items found.", searchTerm = "" }) {
    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="login-spinner mx-auto mb-4"></div>
                <p className="text-slate-400">Loading...</p>
            </div>
        );
    }

    if (!children || (Array.isArray(children) && children.length === 0)) {
        return (
            <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                    {searchTerm ? `No items match your search for "${searchTerm}".` : emptyMessage}
                </div>
            </div>
        );
    }

    return <div className="mt-4">{children}</div>;
}

// Complete Admin Page Layout Component
export function AdminPageLayout({ 
    title,
    stats = [],
    searchTerm = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    onCreateClick,
    createButtonText = "Create New",
    showCreateButton = true,
    additionalButtons = [],
    children,
    isLoading = false,
    emptyMessage = "No items found.",
    contentGridClass = "grid-2 gap-6"
}) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <AdminPageHeader 
                title={title}
            />

            {/* Stats Cards */}
            {stats.length > 0 && (
                <AdminStatsCards stats={stats} />
            )}

            {/* Search and Create */}
            <AdminSearchCreate
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                onCreateClick={onCreateClick}
                createButtonText={createButtonText}
                showCreateButton={showCreateButton}
                additionalButtons={additionalButtons}
            />

            {/* Content List */}
            <AdminContentList 
                isLoading={isLoading}
                emptyMessage={emptyMessage}
                searchTerm={searchTerm}
            >
                {children && (
                    <div className={contentGridClass}>
                        {children}
                    </div>
                )}
            </AdminContentList>
        </div>
    );
}

// Admin Card Component (for consistent card styling)
export function AdminCard({ children, onClick, className = "" }) {
    return (
        <div
            className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// Admin Loading Screen Component
export function AdminLoadingScreen({ message = "Loading..." }) {
    return (
        <div className="text-center py-12">
            <div className="login-spinner mx-auto mb-4"></div>
            <p className="text-slate-400">{message}</p>
        </div>
    );
}

// Admin Empty State Component
export function AdminEmptyState({ 
    message = "No items found.", 
    actionText, 
    onActionClick,
    icon: Icon
}) {
    return (
        <div className="text-center py-12">
            {Icon && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-slate-400" />
                </div>
            )}
            <div className="text-slate-400 mb-4">{message}</div>
            {actionText && onActionClick && (
                <button className="btn-primary" onClick={onActionClick}>
                    {actionText}
                </button>
            )}
        </div>
    );
}
