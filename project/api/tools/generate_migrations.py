import json
import os
import re

def map_type(mysql_type: str, col_name: str):
    t = mysql_type.lower().strip()
    if "auto_increment" in t and col_name == "id":
        return ("id", [])
    if t.startswith("varchar"):
        m = re.search(r"varchar\((\d+)\)", t)
        n = int(m.group(1)) if m else 255
        return ("string", [n])
    if t.startswith("int(11)"):
        return ("integer", [])
    if t.startswith("tinyint(1)"):
        return ("boolean", [])
    if t == "datetime":
        return ("dateTime", [])
    if t == "text":
        return ("text", [])
    if t.startswith("decimal"):
        m = re.search(r"decimal\((\d+),(\d+)\)", t)
        if m:
            return ("decimal", [int(m.group(1)), int(m.group(2))])
        return ("decimal", [10, 2])
    if t.startswith("date"):
        return ("date", [])
    return ("string", [255])


schema_path = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "docs", "sa", "_schema.json"
)
out_dir = os.path.join(os.path.dirname(__file__), "..", "database", "migrations")

with open(schema_path, encoding="utf-8-sig") as f:
    tables = json.load(f)

order = [
    "companies_vn",
    "suppliers_jp",
    "product_categories",
    "products",
    "warehouses",
    "inventories",
    "admins",
    "orders",
    "order_details",
    "exchange_rates",
    "import_declarations",
    "mail_templates",
    "mail_histories",
]
skip_fk_to = {"branches"}

for i, table in enumerate(order):
    if table not in tables:
        print("MISSING", table)
        continue

    info = tables[table]
    ts = f"2026_06_07_{i + 1:06d}"
    fname = f"{ts}_create_{table}_table.php"
    lines = [
        "<?php",
        "",
        "use Illuminate\\Database\\Migrations\\Migration;",
        "use Illuminate\\Database\\Schema\\Blueprint;",
        "use Illuminate\\Support\\Facades\\Schema;",
        "",
        "return new class extends Migration",
        "{",
        "    public function up(): void",
        "    {",
        f"        Schema::create('{table}', function (Blueprint $table) {{",
    ]

    for col in info["columns"]:
        name = col["name"]
        method, args = map_type(col["type"], name)
        if method == "id":
            lines.append("            $table->id();")
            continue

        arg_str = ", ".join(str(a) for a in args)
        call = f'$table->{method}("{name}"' + (f", {arg_str}" if arg_str else "") + ")"
        call += "->nullable(false)" if col["not_null"] else "->nullable()"
        if col["default"] == "0" and method == "boolean":
            call += "->default(false)"
        elif col["default"] and col["default"] not in ("", "0"):
            call += f"->default('{col['default']}')"
        elif col["default"] == "0" and method != "boolean":
            call += "->default(0)"
        lines.append(f"            {call};")

    for idx in info["indexes"]:
        if idx["name"] == "PRIMARY":
            continue
        cols = [c.strip() for c in idx["cols"].split(",")]
        if idx["unique"]:
            if len(cols) == 1:
                lines.append(f"            $table->unique('{cols[0]}', '{idx['name']}');")
            else:
                lines.append(f"            $table->unique({cols}, '{idx['name']}');")
        elif len(cols) == 1:
            lines.append(f"            $table->index('{cols[0]}', '{idx['name']}');")

    for fk in info["fks"]:
        if fk["ref_table"] in skip_fk_to:
            continue
        ref_col = fk.get("ref_col") or "id"
        lines.append(
            f"            $table->foreign('{fk['col']}', '{fk['name']}')"
            f"->references('{ref_col}')->on('{fk['ref_table']}');"
        )

    lines.extend(
        [
            "        });",
            "    }",
            "",
            "    public function down(): void",
            "    {",
            f"        Schema::dropIfExists('{table}');",
            "    }",
            "};",
            "",
        ]
    )

    path = os.path.join(out_dir, fname)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Wrote", fname)
