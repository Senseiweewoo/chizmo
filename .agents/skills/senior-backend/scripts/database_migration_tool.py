#!/usr/bin/env python3
"""
Database Migration & Schema Optimization Tool
Analyzes Prisma and SQL schemas for missing indexes, unindexed foreign keys, and optimization gaps.
"""

import os
import re
import sys
import argparse

def analyze_prisma_schema(schema_path: str, verbose: bool = False):
    if not os.path.exists(schema_path):
        print(f"Error: Schema path '{schema_path}' does not exist.")
        return 1

    with open(schema_path, "r", encoding="utf-8") as f:
        content = f.read()

    models = re.findall(r"model\s+(\w+)\s+\{([^}]+)\}", content, re.MULTILINE)
    print(f"\n=======================================================")
    print(f"  Database Schema Optimization Audit: {schema_path}")
    print(f"  Analyzed Models: {len(models)}")
    print(f"=======================================================\n")

    issues_found = 0
    total_indexes = 0

    for model_name, model_body in models:
        lines = [l.strip() for l in model_body.strip().split("\n") if l.strip() and not l.strip().startswith("//")]
        
        fields = {}
        indexes = []
        relations = []

        for line in lines:
            if line.startswith("@@index"):
                indexes.append(line)
                total_indexes += 1
            elif line.startswith("@@unique") or line.startswith("@@id"):
                indexes.append(line)
                total_indexes += 1
            elif not line.startswith("@@"):
                tokens = line.split()
                if len(tokens) >= 2:
                    field_name = tokens[0]
                    field_type = tokens[1]
                    fields[field_name] = field_type
                    if "@unique" in line or "@id" in line:
                        indexes.append(f"inline_unique_{field_name}")
                        total_indexes += 1
                    if "@relation" in line:
                        # Extract foreign key field if present
                        fk_match = re.search(r"fields:\s*\[([^\]]+)\]", line)
                        if fk_match:
                            fk_field = fk_match.group(1).strip()
                            relations.append((field_name, fk_field))

        # Check: Foreign keys missing index
        for rel_name, fk_field in relations:
            is_indexed = any(fk_field in idx for idx in indexes)
            if not is_indexed:
                print(f"[WARN] {model_name}.{fk_field}: Foreign key relation '{rel_name}' lacks an index.")
                print(f"       Recommendation: Add @@index([{fk_field}]) to speed up JOIN and CASCADE operations.\n")
                issues_found += 1

        # Check: Soft delete or active status filtering
        for field in ["status", "isDeleted", "active"]:
            if field in fields and not any(field in idx for idx in indexes):
                if verbose:
                    print(f"[INFO] {model_name}.{field}: Filter field detected without index. Consider @@index([{field}]) if frequently queried.")

    print(f"-------------------------------------------------------")
    print(f"Total Indexes Configured: {total_indexes}")
    if issues_found == 0:
        print(f"Schema Status: EXCELLENT (Zero missing foreign key indexes detected)")
    else:
        print(f"Optimization Recommendations: {issues_found} improvements identified")
    print(f"-------------------------------------------------------\n")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Prisma Schema Optimization & Indexing Auditor")
    parser.add_argument("schema", nargs="?", default="packages/db/prisma/schema.prisma", help="Path to schema.prisma")
    parser.add_argument("--verbose", "-v", action="store_true", help="Display verbose indexing suggestions")
    args = parser.parse_args()

    return analyze_prisma_schema(args.schema, args.verbose)

if __name__ == "__main__":
    sys.exit(main())
