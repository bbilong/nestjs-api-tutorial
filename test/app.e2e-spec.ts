import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  const PORT = 3333;
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(PORT);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl(`http://localhost:${PORT}`);
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const credentials: AuthDto = {
      email: 'jonh.doe@gmail.com',
      password: '123123',
    };

    describe('SignUp', () => {
      it('should throw if email is empty', () => {
        // given
        const credentialsWithEmptyEmail = {
          ...credentials,
          email: '',
        };
        const badResponse = {
          statusCode: 400,
          message: ['email should not be empty', 'email must be an email'],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signUp')
          .withBody(credentialsWithEmptyEmail)
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should throw if password is empty', () => {
        // given
        const credentialsWithEmptyPassword = {
          ...credentials,
          password: '',
        };
        const badResponse = {
          statusCode: 400,
          message: ['password should not be empty'],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signUp')
          .withBody(credentialsWithEmptyPassword)
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should throw if no body provided', () => {
        // given
        const badResponse = {
          statusCode: 400,
          message: [
            'email should not be empty',
            'email must be an email',
            'password should not be empty',
            'password must be a string',
          ],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signUp')
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should signup', () => {
        // when - then
        return pactum
          .spec()
          .post('/auth/signUp')
          .withBody(credentials)
          .expectStatus(HttpStatus.CREATED);
      });
    });

    describe('SignIn', () => {
      it('should throw if email is empty', () => {
        // given
        const credentialsWithEmptyEmail = {
          ...credentials,
          email: '',
        };
        const badResponse = {
          statusCode: 400,
          message: ['email should not be empty', 'email must be an email'],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signIn')
          .withBody(credentialsWithEmptyEmail)
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should throw if password is empty', () => {
        // given
        const credentialsWithEmptyPassword = {
          ...credentials,
          password: '',
        };
        const badResponse = {
          statusCode: 400,
          message: ['password should not be empty'],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signIn')
          .withBody(credentialsWithEmptyPassword)
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should throw if no body provided', () => {
        // given
        const badResponse = {
          statusCode: 400,
          message: [
            'email should not be empty',
            'email must be an email',
            'password should not be empty',
            'password must be a string',
          ],
          error: 'Bad Request',
        };

        // when - then
        return pactum
          .spec()
          .post('/auth/signIn')
          .expectStatus(HttpStatus.BAD_REQUEST)
          .expectBody(badResponse);
      });

      it('should signin', () => {
        // when - then
        return pactum
          .spec()
          .post('/auth/signIn')
          .withBody(credentials)
          .expectStatus(HttpStatus.OK)
          .stores('userAccessToken', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        // when - then
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.OK);
      });
    });

    describe('Edit user', () => {
      it('should edit current user', () => {
        // given
        const editedUser: EditUserDto = {
          firstName: 'John',
          lastName: 'Doe',
        };

        // when - then
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .withBody(editedUser)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editedUser.firstName)
          .expectBodyContains(editedUser.lastName);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get empty bookmarks', () => {
        // when - then
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      it('should create bookmark', () => {
        // given
        const createDto: CreateBookmarkDto = {
          title: 'My first bookmark',
          link: 'http://www.google.fr',
        };

        // when - then
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .withBody(createDto)
          .expectStatus(HttpStatus.CREATED)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmark', () => {
      it('should get bookmarks', () => {
        // when - then
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        // when - then
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.OK)
          .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark', () => {
      it('should edit bookmark', () => {
        // given
        const editDto: EditBookmarkDto = {
          title: 'My first bookmark',
          link: 'http://www.google.fr',
          description: 'The description of my first bookmark',
        };

        // when - then
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .withBody(editDto)
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(editDto.description)
          .inspect();
      });
    });

    describe('Delete bookmark', () => {
      it('should delete bookmark', () => {
        // when - then
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.NO_CONTENT);
      });

      it('should get empty bookmarks', () => {
        // when - then
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAccessToken}',
          })
          .expectStatus(HttpStatus.OK)
          .expectJsonLength(0);
      });
    });
  });
});
