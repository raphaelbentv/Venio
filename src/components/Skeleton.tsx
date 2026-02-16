import React from 'react'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export const SkeletonText: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-text ${className}`} style={style} />
)

export const SkeletonTitle: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-title ${className}`} style={style} />
)

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-card ${className}`} style={style} />
)

export const SkeletonStat: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-stat ${className}`} style={style} />
)

export const SkeletonRow: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`skeleton skeleton-row ${className}`} style={style} />
)

interface SkeletonGridProps {
  count?: number
  className?: string
  style?: React.CSSProperties
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 3, className = '', style }) => (
  <div className={`skeleton-grid ${className}`} style={style}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)
