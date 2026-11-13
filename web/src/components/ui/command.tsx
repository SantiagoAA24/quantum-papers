"use client";

/**
 * shadcn/ui «Command» (cmdk), sin estilos por defecto: las clases las pone
 * quien lo usa (aquí, las .qp-cmd* de components.css). Sin CommandDialog ni iconos.
 */
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cx } from "@/lib/cx";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => <CommandPrimitive ref={ref} className={cx(className)} {...props} />);
Command.displayName = "Command";

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => <CommandPrimitive.Input ref={ref} className={cx(className)} {...props} />);
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => <CommandPrimitive.List ref={ref} className={cx(className)} {...props} />);
CommandList.displayName = "CommandList";

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => <CommandPrimitive.Group ref={ref} className={cx(className)} {...props} />);
CommandGroup.displayName = "CommandGroup";

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => <CommandPrimitive.Item ref={ref} className={cx(className)} {...props} />);
CommandItem.displayName = "CommandItem";

export { Command, CommandInput, CommandList, CommandGroup, CommandItem };
