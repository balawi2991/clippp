import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStyle() {
  const project = await prisma.project.findUnique({
    where: { id: '7234c60f-c285-41d2-92ad-c10f29d202ae' }
  });
  
  if (project) {
    console.log('Project found!');
    console.log('\nstyleJson:', project.styleJson);
    
    const style = JSON.parse(project.styleJson);
    console.log('\nParsed style:');
    console.log('- theme:', style.theme);
    console.log('- overrides:', style.overrides);
    console.log('\nFull style object:');
    console.log(JSON.stringify(style, null, 2));
  } else {
    console.log('Project not found');
  }
  
  await prisma.$disconnect();
}

checkStyle();
