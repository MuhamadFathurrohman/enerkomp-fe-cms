import React from "react";
import "../../sass/components/Loader/SkeletonItem/SkeletonItem.css";

const SkeletonItem = ({ className = "", style, children }) => {
  const baseClass = "skeleton-item";

  // Jika ada children, gunakan sebagai container shimmer
  if (children) {
    return (
      <div className={`${baseClass} ${className}`} style={style}>
        {children}
      </div>
    );
  }

  // Jika tidak ada children, jadikan elemen dasar
  return <div className={`${baseClass} ${className}`} style={style} />;
};

export default SkeletonItem;
