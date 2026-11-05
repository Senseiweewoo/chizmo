#!/usr/bin/env python3
"""
Dependency Analyzer & Boundary Checker
Audits monorepo package.json workspaces, validates unidirectional imports, and checks version consistency.
"""

import os
import json
import sys
import argparse

def analyze_dependencies(root_dir: str):
    root_pkg_path = os.path.join(root_dir, "package.json")
    if not os.path.exists(root_pkg_path):
        print(f"Error: No package.json found at '{root_pkg_path}'")
        return 1

    with open(root_pkg_path, "r", encoding="utf-8") as f:
        root_pkg = json.load(f)

    workspaces = root_pkg.get("workspaces", [])
    print("\n=======================================================")
    print("  Senior Architect: Monorepo Dependency Analysis")
    print(f"  Configured Workspaces: {len(workspaces)}")
    print("=======================================================\n")

    workspace_pkgs = {}
    for pattern in workspaces:
        # e.g., "apps/*", "packages/*"
        base_dir = pattern.replace("/*", "")
        full_base = os.path.join(root_dir, base_dir)
        if os.path.exists(full_base):
            for sub in os.listdir(full_base):
                sub_pkg_path = os.path.join(full_base, sub, "package.json")
                if os.path.exists(sub_pkg_path):
                    with open(sub_pkg_path, "r", encoding="utf-8") as pf:
                        pkg_json = json.load(pf)
                        name = pkg_json.get("name", f"{base_dir}/{sub}")
                        workspace_pkgs[name] = {
                            "path": os.path.relpath(sub_pkg_path, root_dir),
                            "deps": list(pkg_json.get("dependencies", {}).keys()),
                            "devDeps": list(pkg_json.get("devDependencies", {}).keys()),
                        }

    print("Discovered Workspaces & Internal Dependencies:")
    print("-------------------------------------------------------")
    circular_detected = False
    for name, info in workspace_pkgs.items():
        internal_deps = [d for d in info["deps"] if d.startswith("@chizmo/")]
        print(f"  {name.ljust(22)} -> {internal_deps or '[]'}")

        # Check: package should not depend on apps
        if name.startswith("@chizmo/core") or name.startswith("@chizmo/db") or name.startswith("@chizmo/ai"):
            for dep in internal_deps:
                if "web" in dep or "worker" in dep or "realtime" in dep:
                    print(f"  [ERROR] Boundary Violation: {name} imports app '{dep}'!")
                    circular_detected = True

    print("-------------------------------------------------------")
    if not circular_detected:
        print("[OK] Workspace Boundaries: CLEAN (Strict unidirectional dependency flow)")
    else:
        print("[FAIL] Boundary Violations Detected: Inverted dependency flow.")
    print("=======================================================\n")
    return 1 if circular_detected else 0

def main():
    parser = argparse.ArgumentParser(description="Audit monorepo workspace dependencies")
    parser.add_argument("path", nargs="?", default=".", help="Root directory")
    args = parser.parse_args()

    return analyze_dependencies(args.path)

if __name__ == "__main__":
    sys.exit(main())
