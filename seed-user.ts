import "dotenv/config";
import { db } from "./db/index";
import { users } from "./db/schema/users";
import bcrypt from "bcryptjs";

async function main() {
  const username = "ashishsah1000";
  const password = "AcceptedPassword123";
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    await db.insert(users).values({
      username,
      passwordHash,
    });
    console.log("User created successfully!");
  } catch (e: any) {
    if (e.code === '23505') { // Unique violation
      console.log("User already exists.");
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}

main();
