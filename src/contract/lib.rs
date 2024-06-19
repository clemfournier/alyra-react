use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("E6gEbyUSGkQbwd3CpJmoHMgU9Gnzm3x5kKsLHoj5x5AT");

#[program]
mod hello_anchor {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, data: u64, age: u16) -> Result<()> {
        ctx.accounts.new_account.data = data;
        ctx.accounts.new_account.age = age;
        msg!("Changed data to: {} {}!", data, age);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = 8 + NewAccount::INIT_SPACE,
        seeds = [b"account".as_ref(), signer.key().as_ref()],
        bump
    )]
    pub new_account: Account<'info, NewAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct NewAccount {
    data: u64,
    age: u16,
}
