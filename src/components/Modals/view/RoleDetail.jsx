import React, { useState, useEffect } from "react";
import { roleService } from "../../../services/roleService";
import { usersService } from "../../../services/usersService";
import { formatRoleName, getRoleBadgeClass } from "../../../utils/roleHelper";
import "../../../sass/components/Modals/RoleDetail/RoleDetail.css";

// Fungsi helper: format resource name (handle underscore/dash)
const formatResourceName = (resource) => {
  if (!resource) return "";
  return resource
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Komponen Loading Spinner
const LoadingSpinner = () => (
  <div className="role-detail-spinner-container">
    <div className="role-detail-spinner"></div>
    <p>Loading role details...</p>
  </div>
);

const RoleDetail = ({ role }) => {
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Ambil SEMUA resource (termasuk "role") dengan isSuperAdmin=true
        const roleResult = await roleService.getById(role.id, true);
        if (!roleResult.success) {
          throw new Error(roleResult.message || "Failed to load role data");
        }

        const rolePermissions = roleResult.data.permissions || [];
        setPermissions(rolePermissions);

        const usersResult = await usersService.getPaginated();
        if (!usersResult.success) {
          throw new Error(usersResult.message || "Failed to load users");
        }

        const roleUsers = usersResult.data
          .filter((user) => user.roleId === role.id && !user.deletedAt)
          .map((user) => ({
            id: user.id,
            name: user.name,
            roleName: role.name,
          }));

        setUsers(roleUsers);
      } catch (err) {
        console.error("Failed to load role details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role.id, role.name]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="role-detail-error">{error}</div>;
  }

  // Tampilkan semua resource
  const allPermissions = permissions;

  return (
    <div className="role-detail-content">
      {/* Penjelasan Permission Umum */}
      <div className="role-detail-permission-explanation">
        <h3>Permission Overview</h3>
        <div className="role-detail-explanation-content">
          <p>
            This role's access is defined per resource. Below is the complete
            permission breakdown:
          </p>
          <ul>
            <li>
              <strong>None</strong>: Resource is completely hidden and
              inaccessible.
            </li>
            <li>
              <strong>Read</strong>: View-only access. Export data is available.
            </li>
            <li>
              <strong>Manage</strong>: Full CRUD access — create, read, update,
              delete, and export (where applicable).
            </li>
          </ul>
        </div>
      </div>

      {/* Daftar User */}
      <div className="role-detail-users-section">
        <h3>Users with this Role ({users.length})</h3>
        {users.length === 0 ? (
          <p className="role-detail-no-users">
            No users assigned to this role.
          </p>
        ) : (
          <div className="role-detail-users-list">
            {users.map((user) => (
              <div key={user.id} className="role-detail-user-item">
                <span className="role-detail-user-name">{user.name}</span>
                <span className={`badge role ${getRoleBadgeClass(role.name)}`}>
                  {formatRoleName(role.name)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daftar Permission Detail LENGKAP */}
      {allPermissions.length > 0 ? (
        <div className="role-detail-permissions-section">
          <h3>Resource Permissions ({allPermissions.length})</h3>
          <div className="role-detail-permissions-grid">
            {allPermissions.map((perm) => (
              <div key={perm.resource} className="role-detail-permission-item">
                <span className="role-detail-permission-resource">
                  {formatResourceName(perm.resource)}
                </span>
                <span
                  className={`role-detail-permission-access access-${perm.action}`}
                >
                  {perm.action.charAt(0).toUpperCase() + perm.action.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="role-detail-permissions-section">
          <h3>Resource Permissions</h3>
          <p className="role-detail-no-permissions">
            No permission data available.
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleDetail;
