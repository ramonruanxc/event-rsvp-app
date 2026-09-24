import { z } from 'zod';

const requiredText = (max: number) =>
  z.string({ error: 'required' }).trim().min(1, 'required').max(max, 'tooLong');

export const eventNameSchema = requiredText(120);
export const eventDescriptionSchema = requiredText(2000);
