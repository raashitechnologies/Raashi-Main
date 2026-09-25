"""
RBAC Permission Model for Raashi Cognitive Technologies.
Defines resources, permissions, and role-permission mappings.
"""
from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"


class Permission(str, Enum):
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"
    APPROVE = "approve"
    SHORTLIST = "shortlist"
    REJECT = "reject"


class Resource(str, Enum):
    WEBSITE_CONTENT = "website_content"
    DOMAINS = "domains"
    INTERNSHIPS = "internships"
    CAREERS = "careers"
    INTERNSHIP_APPLICATIONS = "internship_applications"
    CAREER_APPLICATIONS = "career_applications"
    CONTACTS = "contacts"
    USERS = "users"
    REPORTS = "reports"
    SETTINGS = "settings"
    AUDIT_LOGS = "audit_logs"


# Full permission set shorthand
_ALL = {p for p in Permission}
_REVIEW = {Permission.VIEW, Permission.EDIT, Permission.APPROVE, Permission.SHORTLIST, Permission.REJECT}

ROLE_PERMISSIONS: dict[Role, dict[Resource, set[Permission]]] = {
    Role.ADMIN: {resource: _ALL for resource in Resource},

    Role.COORDINATOR: {
        Resource.INTERNSHIP_APPLICATIONS: _REVIEW,
        Resource.CAREER_APPLICATIONS: _REVIEW,
        Resource.CONTACTS: {Permission.VIEW, Permission.EDIT},
        Resource.INTERNSHIPS: {Permission.VIEW},
        Resource.CAREERS: {Permission.VIEW},
        Resource.REPORTS: {Permission.VIEW},
    },
}


def has_permission(role: Role, resource: Resource, permission: Permission) -> bool:
    """Check whether a role has a specific permission on a resource."""
    role_perms = ROLE_PERMISSIONS.get(role, {})
    resource_perms = role_perms.get(resource, set())
    return permission in resource_perms


def get_role_permissions(role: Role) -> dict[str, list[str]]:
    """Return a serializable dict of permissions for a role."""
    role_perms = ROLE_PERMISSIONS.get(role, {})
    return {
        resource.value: [p.value for p in perms]
        for resource, perms in role_perms.items()
    }
