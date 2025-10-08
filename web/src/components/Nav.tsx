"use client";
import Link from "next/link";
import { Group, Container, Anchor, Title } from "@mantine/core";

export function NavBar() {
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
      <Container size="lg" py="sm">
        <Group justify="space-between" align="center">
          <Title order={3} style={{ margin: 0 }}>Grade Calculators</Title>
          <Group gap="md">
            <Anchor component={Link} href="/" underline="never">Home</Anchor>
          </Group>
        </Group>
      </Container>
    </div>
  );
}



