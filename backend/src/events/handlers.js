const { bus } = require("./bus");
const { prisma } = require("../prisma");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

bus.on("ticket_created", async ({ ticketId, h3_index, category }) => {
  try {
    const categoryRecord = await prisma.ticketCategory.findUnique({
      where: { code: category },
      include: { department: true }
    });
    const department = categoryRecord?.department;
    const date = todayISO();

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedDepartmentId: department?.id || null }
    });
    await prisma.h3Aggregate.upsert({
      where: { h3Index_date: { h3Index: h3_index, date } },
      update: { ticketCount: { increment: 1 } },
      create: { h3Index: h3_index, date, ticketCount: 1 }
    });

    console.log(
      `[EVENT] ticket_created processed ticketId=${ticketId} category=${category} assigned_department=${department?.code || "NONE"} h3=${h3_index}`
    );
  } catch (err) {
    console.error(`[EVENT] ticket_created failed ticketId=${ticketId}`, err);
  }
});
