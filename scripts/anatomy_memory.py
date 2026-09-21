#!/usr/bin/env python3
"""Anatomy Arcade — persistent agent memory via cortexm (user's context-m tooling).

Usage:
  python3 anatomy_memory.py add 'user_id' 'text of fact'      # add one fact
  python3 anatomy_memory.py search 'user_id' 'query'          # recall facts
  python3 anatomy_memory.py dump 'user_id'                    # print all facts
  python3 anatomy_memory.py export                            # export md + commit+push to context-m repo

DB lives inside the context-m git repo so it survives sandbox wipes
(two durability layers: cortexm .db + git-pushed markdown export).
"""
import sys, os, subprocess
from datetime import date

DB_PATH = "/home/z/my-project/context-m/memory/anatomy-arcade.db"
EXPORT_MD = "/home/z/my-project/context-m/memory/anatomy-arcade-facts.md"
CONTEXT_M_REPO = "/home/z/my-project/context-m"


def get_memory():
    from cortexm import Memory, Config
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    cfg = Config(db_path=DB_PATH)
    return Memory(config=cfg)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "export"

    if cmd == "add":
        user_id, text = sys.argv[2], sys.argv[3]
        m = get_memory()
        m.add(text, user_id=user_id)
        m.close()
        os.makedirs(os.path.dirname(EXPORT_MD), exist_ok=True)
        if not os.path.exists(EXPORT_MD):
            with open(EXPORT_MD, "w") as fh:
                fh.write("# anatomy-arcade — agent memory (append-only fact log)\n\n"
                         f"_DB: `memory/anatomy-arcade.db` • cortexm μ=0 deterministic memory • started {date.today()}_\n\n"
                         "_Query recipe: `python3 /home/z/my-project/scripts/anatomy_memory.py search anatomy-arcade \"<query>\"`_\n")
        with open(EXPORT_MD, "a") as fh:
            fh.write(f"- {text}\n")
        print(f"stored into {DB_PATH} [{user_id}]: {text[:80]}...")
        return

    if cmd == "search":
        user_id, query = sys.argv[2], sys.argv[3]
        m = get_memory()
        res = m.search(query, user_id=user_id)
        print(res)
        m.close()
        return

    if cmd == "dump":
        user_id = sys.argv[2]
        m = get_memory()
        for f in m.get_all(user_id=user_id):
            print(f)
        m.close()
        return

    if cmd == "export":
        m = get_memory()
        out_dir = os.path.join(CONTEXT_M_REPO, "memory", "export")
        os.makedirs(out_dir, exist_ok=True)
        m.export_markdown(out_dir=out_dir, user_id="anatomy-arcade")
        m.close()
        # EXPORT_MD (append-only fact log, maintained by `add`) + .db + structured
        # export dir all live inside the context-m git repo; just commit+push them.
        for c in [
            ["git", "-C", CONTEXT_M_REPO, "add", "memory/"],
            ["git", "-C", CONTEXT_M_REPO, "commit", "-m", f"anatomy-arcade memory export {date.today()}"],
            ["git", "-C", CONTEXT_M_REPO, "push", "-q", "origin", "HEAD"],
        ]:
            r = subprocess.run(c, capture_output=True, text=True)
            out = (r.stdout + r.stderr).strip()
            if "nothing to commit" in out.lower():
                print("(context-m: no new facts to commit)")
            elif r.returncode != 0:
                print("git warn:", out[:300])
        print(f"exported -> {EXPORT_MD} + pushed to context-m")
        return

    print(__doc__)
    sys.exit(2)


if __name__ == "__main__":
    main()
