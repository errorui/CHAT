import ChatForm from "./compontes/Form";
import { Logo } from "./compontes/Logo";

export default function Home() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between gap-12 bg-ink p-12 text-ink-foreground lg:flex xl:p-16">
        <Logo className="text-2xl" />

        <div className="max-w-lg">
          <p className="font-display text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Say it while it&apos;s on the tip of your tongue.
          </p>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-ink-muted">
            One-to-one and group chats that arrive the moment you hit send.
          </p>
        </div>

        {/* decoration */}
        <div aria-hidden className="flex max-w-md flex-col gap-2 text-[0.9375rem]">
          <p className="w-fit rounded-2xl rounded-bl-md bg-ink-raised px-4 py-2.5">Are we still on for six?</p>
          <p className="w-fit self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground">
            Yes! Grabbing us a table now
          </p>
          <span className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-ink-raised px-3.5 py-3">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-typing rounded-full bg-ink-muted"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 justify-center px-4 py-10 sm:px-8 lg:py-16">
        <div className="my-auto w-full min-w-0 max-w-sm">
          <Logo className="mb-10 text-2xl lg:hidden" />
          <ChatForm />
        </div>
      </div>
    </main>
  );
}
